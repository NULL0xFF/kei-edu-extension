/**
 * @file constants.js
 * @description 프로젝트 전역 상수 정의
 */

/**
 * API 메뉴 ID
 */
export const MENU_ID = {
  COURSE: 'MG0027',
  MEMBER: 'MG0086',
  COMPLETION: 'MG0036',
  APPLICATION: 'MG0028',
  COURSE_ELEMENT: 'MG0005', // 과정 구성요소 메뉴 ID 추가
};

/**
 * 정렬 순서
 */
export const ORDER = {
  ASC: 'asc',
  DESC: 'desc',
};

/**
 * 과정 관련 상수
 */
export const COURSE = {
  STATUS: {
    ALL: '',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },
  TYPE: {
    ALL: '',
    ALWAYS: 'always',
    PERIOD: 'period',
  },
  CATEGORY: {
    ALL: '',
    INTRO: '1',
    ADVANCED: '2',
    GENERAL: '3',
    CUSTOMIZED: '14',
    FOREIGN: '16',
  },
  CATEGORY_NAME: {
    INTRO: '입문',
    ADVANCED: '심화',
    GENERAL: '일반',
    CUSTOMIZED: '맞춤형',
    FOREIGN: '외국어',
  },
  SORT: {
    TITLE_ASC: 1,
    TITLE_DESC: -1,
    CATEGORY_ASC: 2,
    CATEGORY_DESC: -2,
    STATUS_ASC: 3,
    STATUS_DESC: -3,
    DATE_ASC: 4,
    DATE_DESC: -4,
  },
  // 과정 구성요소 타입 추가
  ELEMENT_TYPE: {
    ORGANIZATION: 'organization', // 차시
    EXAM: 'exam', // 시험
  }
};

/**
 * 회원 관련 상수
 */
export const MEMBER = {
  STATUS: {
    ALL: '',
    APPROVAL: 'approval',
    WAIT: 'wait',
    LEAVE: 'leave',
    RELEAVE: 'releave',
  },
  SEARCH_CATEGORY: {
    ALL: '',
    NAME: 'memberName',
    ID: 'memberId',
    BIRTHDAY: 'memberBirthday',
    EMAIL: 'memberEmail',
    COMPANY: 'cxCompanyName',
  },
  SORT: {
    NAME_ASC: 1,
    NAME_DESC: -1,
    ID_ASC: 2,
    ID_DESC: -2,
    DATE_ASC: 3,
    DATE_DESC: -3,
  },
};

/**
 * 수료 관련 상수
 */
export const COMPLETION = {
  STATUS: {
    YES: 'Y',
    NO: 'N',
  },
  SORT: {
    MEMBER_ASC: 1,
    MEMBER_DESC: -1,
    END_DATE_ASC: 4,
    END_DATE_DESC: -4,
  },
};

/**
 * API 엔드포인트
 */
export const API_ENDPOINT = {
  COURSE: {
    LIST: '/course/active/selectActiveOperList.do',
    ELEMENT_LIST: '/course/active/selectAtiveElementList.do',
  },
  MEMBER: {
    LIST: '/user/member/selectMemberList.do',
  },
  COMPLETION: {
    LIST: '/course/cmpl/selectCmplList.do',
  },
  APPLICATION: {
    LIST: '/course/apply/selectApplyList.do',
  },
};

/**
 * 스토리지 키
 */
export const STORAGE_KEY = {
  COURSES: 'courses',
  MEMBERS: 'members',
  LAST_UPDATE: 'lastUpdate',
};

/**
 * 네트워크 설정
 */
export const NETWORK = {
  RETRY_LIMIT: 3,
  RETRY_DELAY: 1000, // ms
  TIMEOUT: 30000, // ms
};

/**
 * UI 설정
 */
export const UI = {
  REFRESH_INTERVAL: 1, // minutes
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 1000,
  BUTTON_CLASS: {
    STATISTICS: 'btn nor btn-blue',
    UPDATE: 'btn nor btn-gray',
  },
};

/**
 * 파일 내보내기 설정
 */
export const EXPORT = {
  CSV_BOM: '\uFEFF',
  FILE_TYPE: {
    CSV: 'csv',
    XLSX: 'xlsx',
  },
};

/**
 * 날짜 형식
 */
export const DATE_FORMAT = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  LOCAL: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  FILE_TIMESTAMP: 'YYYY-MM-DD_HHmmss',
};
