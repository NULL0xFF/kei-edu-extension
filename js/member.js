/**
 * Save data as JSON file
 * @param {string} fileName - The name of the file to save.
 * @param {Object} data - The data to save.
 * @returns {void}
 */
function saveAsJSON(fileName, data) {
    // console.log("saveAsJSON(" + fileName + ", ... ) called");
    var fileContent = JSON.stringify(data);
    var bb = new Blob([fileContent], { type: "text/plain" });
    var a = document.createElement("a");

    a.download = fileName + "_" + new Date().toISOString() + ".json";
    a.href = window.URL.createObjectURL(bb);
    a.click();
}

/**
 * Fetch member data for a single email address.
 * @param {string} mailAddress - The email address to search for.
 * @returns {Promise<Object>} - A promise that resolves with the member data.
 */
function fetchMember(mailAddress) {
    var form = {
        searchCsTitle: mailAddress,
        searchListCnt: 100,
        pageIndex: 1
    };
    return new Promise((resolve, reject) => {
        jQuery.ajax({
            url: "/user/member/selectMemberList.do",
            type: "post",
            data: form,
            dataType: "json",
            success: function (data) {
                if (data.list.length === 0) {
                    console.error(mailAddress + " not found on server");
                    resolve(null);
                } else {
                    var filteredData = data.list.filter(item => item.cxMemberEmail === mailAddress);
                    if (filteredData.length === 0) {
                        console.error(mailAddress + " not found on server");
                        resolve(null);
                    } else {
                        console.info("found a member on server!");
                        resolve(filteredData.map(item => ({
                            csMemberSeq: item.csMemberSeq,
                            csMemberId: item.csMemberId,
                            csMemberName: item.csMemberName,
                            cxMemberBirthday: item.cxMemberBirthday,
                            cxMemberEmail: item.cxMemberEmail,
                            cxCompanyName: item.cxCompanyName,
                            cxDepartmentName: item.cxDepartmentName,
                            cxDivisionCdName: item.cxDivisionCdName,
                            csCertiType: item.csCertiType
                        })));
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error(status);
                reject(error);
            }
        })
    })
}

/**
 * Fetch course data for a single member.
 * @param {Object} memberData - The member data to search for.
 * @returns {Promise<Object>} - A promise that resolves with the course data.
 */
function fetchCourse(memberData) {
    const requestData = {
        dspLinkMenuId: $("#dspLinkMenuId_member").val(),
        dspMenuId: $("#dspMenuId_member").val(),
        searchCsMemberSeq: memberData.csMemberSeq
    };

    return new Promise((resolve, reject) => {
        jQuery.ajax({
            url: "/user/member/memberCourseHistoryPopup.do",
            type: "post",
            data: requestData,
            dataType: "html",
            success: function (data) {
                result = cfn_trim(data.toString());
                jQuery("#applyRegArea").html(result);
                var $memberForm = jQuery("#memberSearchForm_member");
                $memberForm[0].searchListCnt_member.value = 100;
                $memberForm[0].searchCsMemberSeq_member.value = memberData.csMemberSeq;
                jQuery("#pageIndex_member", $memberForm).val(1);
                resolve(new Promise((resolve, reject) => {
                    jQuery.ajax({
                        url: "/user/member/selectMemberCourseHistoryPopup.do",
                        type: "post",
                        data: $memberForm.serialize(),
                        dataType: "json",
                        success: function (data) {
                            console.info("found course data from server!");
                            const resultData = {
                                member: memberData,
                                list: []
                            }
                            resultData.member = memberData;
                            for (var i = 0; i < data.list.length; i++) {
                                resultData.list[i] = (({ csYear, csCategoryName, csTitle, csCompletionYn, studyStartDate, studyEndDate, openStartDate, openEndDate }) => ({ csYear, csCategoryName, csTitle, csCompletionYn, studyStartDate, studyEndDate, openStartDate, openEndDate }))(data.list[i]);
                            }
                            resolve(resultData);
                        }, error: function (xhr, status, error) {
                            console.log(xhr);
                            console.log(memberData.cxMemberEmail);
                            this.tryCount++;
                            if (this.tryCount <= this.retryLimit) {
                                jQuery.ajax(this);
                                return;
                            } else {
                                console.error("failed to fetch course data from server!");
                                reject(xhr, status, error);
                            }
                        }
                    });
                }));
            }, error: function (xhr, status, error) {
                console.log(memberData.cxMemberEmail);
                this.tryCount++;
                if (this.tryCount <= this.retryLimit) {
                    jQuery.ajax(this);
                    return;
                } else {
                    reject(xhr, status, error);
                }
            }
        });
    });
}

/**
 * Batching function for dividing work into smaller chunks.
 * @param {Array} batch - The array of items to process.
 * @param {Function} func - The function to apply to each item in the batch.
 * @returns {Promise<Array>} - A promise that resolves with the results of the function applied to each item in the batch.
 * @async
 */
async function runBatch(batch, func) {
    const promises = [];
    for (var i = 0; i < batch.length; i++) {
        promises.push(func(batch[i]));
    }
    return await Promise.all(promises);
}

/**
 * Fetch member data for a list of email addresses.
 * @param {Array<string>} mailArray - The list of email addresses to search for.
 * @param {number} [limit=6] - The number of email addresses to search for in a single batch.
 * @returns {Promise<Array<Object>>} - A promise that resolves with an array of member data.
 * @async
 */
async function fetch(mailArray, limit = 6) {
    var batch = [];
    while (mailArray.length > 0) {
        batch.push(mailArray.splice(0, limit));
    }

    var rawMembers = [];
    for (var i = 0; i < batch.length; i++) {
        var batchData = await runBatch(batch[i], fetchMember);
        for (var j = 0; j < batchData.length; j++) {
            rawMembers.push(batchData[j]);
        }
    }

    var members = [];
    for (var i = 0; i < rawMembers.length; i++) {
        if (rawMembers[i]) {
            for (var j = 0; j < rawMembers[i].length; j++) {
                members.push(rawMembers[i][j]);
            }
        }
    }

    batch = [];
    while (members.length > 0) {
        batch.push(members.splice(0, limit));
    }

    var result = [];
    for (var i = 0; i < batch.length; i++) {
        var batchData = await runBatch(batch[i], fetchCourse);
        for (var j = 0; j < batchData.length; j++) {
            result.push(batchData[j]);
        }
    }

    return result;
}

/**
 * Search members by mail addresses.
 * @param {number} limit - The limit of members to search for.
 * @returns {Promise<Object>} - A promise that resolves with the member data.
 * @async
 */
async function searchMembers(limit = 6) {
    var input = prompt("Input Mail Address(es)");
    var mailArray = input.trim().replace(/\r/g, "").split("\n");

    console.log("Searching members...")
    const begin = new Date();

    var batch = [];
    while (mailArray.length > 0) {
        batch.push(mailArray.splice(0, limit * 100));
    }

    const result = [];
    for (var i = 0; i < batch.length; i++) {
        console.log(`Batch ${i + 1} of ${batch.length}...`);
        fetched = await fetch(batch[i], limit);
        for (var j = 0; j < fetched.length; j++) {
            result.push(fetched[j]);
        }
    }

    console.log("Search completed in " + (new Date() - begin) / 1000 + " seconds.");
    saveAsJSON("", result);
}