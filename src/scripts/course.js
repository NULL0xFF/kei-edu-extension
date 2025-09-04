import * as jQuery from 'jquery';
import { customTable, getCSRFToken } from './shared.js';
import { addData, getData, updateData } from "./storage";
import { estimatedProgressTime } from "./solution";

// Configuration for rate limiting and retry logic
const CONFIG = {
  BATCH_SIZE: 5, // Process courses in batches of 5
  REQUEST_DELAY: 500, // 500ms delay between requests
  BATCH_DELAY: 2000, // 2 second delay between batches
  MAX_RETRIES: 5, // Maximum retry attempts
  BASE_RETRY_DELAY: 1000, // Base delay for exponential backoff (1 second)
  MAX_RETRY_DELAY: 30000, // Maximum retry delay (30 seconds)
  REQUEST_TIMEOUT: 30000, // 30 second timeout for requests
  CIRCUIT_BREAKER_THRESHOLD: 10, // Stop after 10 consecutive failures
  CIRCUIT_BREAKER_RESET_TIME: 60000 // Reset circuit breaker after 1 minute
};

// Circuit breaker state
let circuitBreakerState = {
  failures: 0,
  lastFailureTime: null,
  isOpen: false
};

/**
 * Sleep utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt) {
  const delay = CONFIG.BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
  return Math.min(delay + jitter, CONFIG.MAX_RETRY_DELAY);
}

/**
 * Check and update circuit breaker state
 */
function checkCircuitBreaker() {
  if (circuitBreakerState.isOpen) {
    const timeSinceLastFailure = Date.now() - circuitBreakerState.lastFailureTime;
    if (timeSinceLastFailure > CONFIG.CIRCUIT_BREAKER_RESET_TIME) {
      console.log('Circuit breaker reset - attempting to resume requests');
      circuitBreakerState.isOpen = false;
      circuitBreakerState.failures = 0;
    } else {
      throw new Error(`Circuit breaker is open. Retry in ${Math.ceil((CONFIG.CIRCUIT_BREAKER_RESET_TIME - timeSinceLastFailure) / 1000)} seconds.`);
    }
  }
}

/**
 * Update circuit breaker on failure
 */
function recordFailure() {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailureTime = Date.now();

  if (circuitBreakerState.failures >= CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    console.warn(`Circuit breaker opened due to ${circuitBreakerState.failures} consecutive failures`);
  }
}

/**
 * Reset circuit breaker on success
 */
function recordSuccess() {
  if (circuitBreakerState.failures > 0) {
    console.log('Request successful - resetting failure count');
    circuitBreakerState.failures = 0;
  }
}

/**
 * Enhanced AJAX request with exponential backoff and circuit breaker
 */
async function makeRequest(url, data, description = 'Request') {
  checkCircuitBreaker();

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.debug(`${description} - Attempt ${attempt}/${CONFIG.MAX_RETRIES}`);

      const result = await new Promise((resolve, reject) => {
        const xhr = jQuery.ajax({
          headers: {
            'X-CSRF-TOKEN': getCSRFToken()
          },
          xhrFields: {
            withCredentials: true
          },
          url: url,
          type: "post",
          data: data,
          dataType: "json",
          timeout: CONFIG.REQUEST_TIMEOUT,
          success: resolve,
          error: (xhr, status, error) => {
            reject({ xhr, status, error, attempt });
          }
        });
      });

      recordSuccess();
      return result;

    } catch (error) {
      const isLastAttempt = attempt === CONFIG.MAX_RETRIES;
      const isServerError = error.xhr?.status >= 500 || error.status === 'timeout' || error.status === 'error';
      const isConnectionError = error.xhr?.status === 0 || error.status === 'timeout';

      console.warn(`${description} failed on attempt ${attempt}:`, {
        status: error.xhr?.status,
        statusText: error.xhr?.statusText,
        error: error.error
      });

      if (isLastAttempt) {
        recordFailure();
        throw new Error(`${description} failed after ${CONFIG.MAX_RETRIES} attempts: ${error.error || error.status}`);
      }

      // Only retry on server errors or connection issues
      if (isServerError || isConnectionError) {
        const backoffDelay = calculateBackoffDelay(attempt);
        console.log(`${description} - Retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${CONFIG.MAX_RETRIES})`);
        await sleep(backoffDelay);
      } else {
        // Don't retry client errors (4xx)
        recordFailure();
        throw new Error(`${description} failed with client error: ${error.xhr?.status} ${error.xhr?.statusText}`);
      }
    }
  }
}

/**
 * Enhanced completion count fetcher
 */
async function getCompletionCountEnhanced(csCourseActiveSeq) {
  const data = await makeRequest(
    "/course/cmpl/selectCmplList.do",
    new CompletionRequest(csCourseActiveSeq),
    `Getting completion count for course ${csCourseActiveSeq}`
  );
  return data.cnt;
}

/**
 * Enhanced course completion fetcher
 */
async function getCourseCompletionEnhanced(csCourseActiveSeq, csCourseMasterSeq, count) {
  // Fetch completion list
  const completionData = await makeRequest(
    "/course/cmpl/selectCmplList.do",
    new CompletionRequest(Number(csCourseActiveSeq), count),
    `Getting completion list for course ${csCourseActiveSeq}`
  );

  await sleep(CONFIG.REQUEST_DELAY); // Add delay between related requests

  // Fetch study start dates
  const applicationData = await makeRequest(
    "/course/apply/selectApplyList.do",
    new ApplicationRequest(Number(csCourseActiveSeq), Number(csCourseMasterSeq), count),
    `Getting application list for course ${csCourseActiveSeq}`
  );

  // Process and combine data
  const startDateMap = new Map();
  applicationData.list.forEach(apply => {
    startDateMap.set(apply.csMemberSeq, apply.csStudyStartDate);
  });

  return completionData.list.map(completion => new Completion(
    completion.csMemberSeq,
    completion.csMemberId,
    completion.csMemberName,
    completion.cxMemberEmail,
    completion.csApplyStatusCd,
    startDateMap.get(completion.csMemberSeq) || '',
    completion.csCompletionYn,
    completion.cxCompletionDate
  ));
}

/**
 * Enhanced course class count fetcher
 */
async function getCourseClassCountEnhanced(csCourseActiveSeq) {
  const request = {
    csCourseActiveSeq: csCourseActiveSeq,
    csReferenceTypeCd: 'organization',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  };

  const data = await makeRequest(
    "/course/active/selectAtiveElementList.do",
    request,
    `Getting class count for course ${csCourseActiveSeq}`
  );
  return data.list.length;
}

/**
 * Enhanced course exam count fetcher
 */
async function getCourseExamCountEnhanced(course) {
  const request = {
    csCourseActiveSeq: course.csCourseActiveSeq,
    csReferenceTypeCd: 'exam',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  };

  const data = await makeRequest(
    "/course/active/selectAtiveElementList.do",
    request,
    `Getting exam count for course ${course.csCourseActiveSeq}`
  );
  return data.list.length;
}

/**
 * Process a single course with all its related data
 */
async function processCourse(course, index, total, startTime) {
  try {
    estimatedProgressTime(index, total, startTime, '과정');
    console.log(`Processing course [${index + 1} / ${total}] ${course.csYear} ${course.csTitle}...`);

    // Fetch all course-related data with delays between requests
    const classCount = await getCourseClassCountEnhanced(course.csCourseActiveSeq);
    await sleep(CONFIG.REQUEST_DELAY);

    const examCount = await getCourseExamCountEnhanced(course);
    await sleep(CONFIG.REQUEST_DELAY);

    course.csCmplTime = classCount + examCount;
    console.debug(`Found ${classCount} classes and ${examCount} exams for course ${course.csCourseActiveSeq}`);

    const completionCount = await getCompletionCountEnhanced(course.csCourseActiveSeq);
    await sleep(CONFIG.REQUEST_DELAY);

    console.debug(`Found ${completionCount} completion records for course ${course.csCourseActiveSeq}`);

    const completions = await getCourseCompletionEnhanced(
      course.csCourseActiveSeq,
      course.csCourseMasterSeq,
      completionCount
    );

    course.csCmplList = completions;
    console.debug(`Successfully processed course ${course.csCourseActiveSeq} with ${completions.length} completions`);

    return course;
  } catch (error) {
    console.error(`Failed to process course ${course.csCourseActiveSeq}: ${error.message}`);
    // Return course with minimal data to avoid breaking the entire process
    course.csCmplTime = 0;
    course.csCmplList = [];
    return course;
  }
}

/**
 * Process courses in batches to avoid overwhelming the server
 */
async function processCoursesInBatches(courses) {
  const processedCourses = [];
  const startTime = Date.now();

  for (let i = 0; i < courses.length; i += CONFIG.BATCH_SIZE) {
    const batch = courses.slice(i, i + CONFIG.BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(courses.length / CONFIG.BATCH_SIZE)} (courses ${i + 1}-${Math.min(i + CONFIG.BATCH_SIZE, courses.length)})`);

    try {
      // Process batch courses sequentially with delays
      for (let j = 0; j < batch.length; j++) {
        const courseIndex = i + j;
        const processedCourse = await processCourse(batch[j], courseIndex, courses.length, startTime);
        processedCourses.push(processedCourse);

        // Add delay between courses in the same batch
        if (j < batch.length - 1) {
          await sleep(CONFIG.REQUEST_DELAY);
        }
      }

      // Add delay between batches (except for the last batch)
      if (i + CONFIG.BATCH_SIZE < courses.length) {
        console.log(`Batch completed. Waiting ${CONFIG.BATCH_DELAY}ms before next batch...`);
        await sleep(CONFIG.BATCH_DELAY);
      }

    } catch (error) {
      console.error(`Batch processing failed:`, error);
      // Add remaining courses from failed batch with minimal data
      for (let j = processedCourses.length - i; j < batch.length; j++) {
        batch[j].csCmplTime = 0;
        batch[j].csCmplList = [];
        processedCourses.push(batch[j]);
      }
    }
  }

  return processedCourses;
}

/**
 * Enhanced course fetching function
 */
async function fetchCoursesEnhanced(action) {
  try {
    console.log('Starting enhanced course fetching process...');

    // Reset circuit breaker state
    circuitBreakerState = {
      failures: 0,
      lastFailureTime: null,
      isOpen: false
    };

    console.log('Fetching count of courses...')
    const totalCourseCount = await makeRequest(
      "/course/active/selectActiveOperList.do",
      new CourseRequest(),
      'Getting total course count'
    );

    await sleep(CONFIG.REQUEST_DELAY);

    console.log(`Found ${totalCourseCount.cnt} courses.`)

    console.log('Fetching courses...')
    const coursesData = await makeRequest(
      "/course/active/selectActiveOperList.do",
      new CourseRequest(totalCourseCount.cnt),
      'Getting all courses'
    );

    const courses = coursesData.list.map(course => new Course(
      course.csCourseActiveSeq,
      course.csCourseMasterSeq,
      course.csTitle,
      course.csStatusCd,
      course.csCourseTypeCd,
      course.csYear,
      course.csApplyStartDate,
      course.csApplyEndDate,
      course.csStudyStartDate,
      course.csStudyEndDate,
      course.csOpenStartDate,
      course.csOpenEndDate,
      null,
      course.csTitlePath,
      null
    ));

    console.log(`Fetched ${courses.length} courses. Starting batch processing...`)

    const processedCourses = await processCoursesInBatches(courses);
    console.log(`Successfully processed ${processedCourses.length} courses.`)

    if (action === 'add') {
      console.log('Adding courses to database...')
      await addData('courses', processedCourses);
      console.log(`Successfully added ${processedCourses.length} courses to database.`)
    } else if (action === 'update') {
      console.log('Updating courses in database...')
      await updateData('courses', processedCourses);
      console.log(`Successfully updated ${processedCourses.length} courses in database.`)
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return processedCourses;

  } catch (error) {
    console.error('Enhanced course fetching failed:', error);
    throw error;
  }
}

/**
 * Enhanced update courses function
 */
export async function updateCoursesEnhanced() {
  return await fetchCoursesEnhanced('update');
}

/**
 * Enhanced add courses function
 */
export async function addCoursesEnhanced() {
  return await fetchCoursesEnhanced('add');
}

// Also export original functions for backward compatibility
export async function updateCourses() {
  console.log('Using enhanced course update with rate limiting...');
  return await updateCoursesEnhanced();
}