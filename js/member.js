// Function to save data as JSON file
function saveAsJSON(fileName, data) {
    console.log("saveAsJSON(" + fileName + ", ... ) called");
    var fileContent = JSON.stringify(data);
    var bb = new Blob([fileContent], { type: "text/plain" });
    var a = document.createElement("a");

    a.download = fileName + "_" + new Date().toISOString() + ".json";
    a.href = window.URL.createObjectURL(bb);
    a.click();
}

// Function to get member data for a single email address
function getMemberDataPromise(mailAddress) {
    var formData = {
        searchCsTitle: mailAddress,
        searchListCnt: 100,
        pageIndex: 1
    };

    return new Promise((resolve, reject) => {
        jQuery.ajax({
            url: "/user/member/selectMemberList.do",
            type: "post",
            data: formData,
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
        });
    });
}

// Function to get member data for an array of email addresses with rate limiting
async function getMemberDataArrayPromiseLimit(mailArray, limit = 1000) {
    const promises = mailArray.map(mailAddress => getMemberDataPromise(mailAddress));
    return limitRequestRate(promises, limit);
}

// Function to get course data for a single member data
function getCourseDataPromise(memberData) {
    const requestData = {
        dspLinkMenuId: "MG0086",
        dspMenuId: "MG0085",
        searchCsMemberSeq: memberData[0].csMemberSeq
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
                $memberForm[0].searchCsMemberSeq_member.value = memberData[0].csMemberSeq;
                jQuery("#pageIndex_member", $memberForm).val(1);
                resolve(new Promise((resolve, reject) => {
                    jQuery.ajax({
                        url: "/user/member/selectMemberCourseHistoryPopup.do",
                        type: "post",
                        data: $memberForm.serialize(),
                        dataType: "json",
                        success: function (data) {
                            const resultData = {
                                member: memberData[0],
                                list: []
                            }
                            resultData.member = memberData[0];
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

// Function to get course data for an array of member data with rate limiting
async function getCourseDataArrayPromiseLimit(memberDataArray, limit = 1000) {
    const promises = memberDataArray.map(memberData => getCourseDataPromise(memberData));
    return limitRequestRate(promises, limit);
}

// Function to limit the rate of AJAX requests
async function limitRequestRate(promiseArray, limit) {
    const result = [];
    while (promiseArray.length) {
        const batch = promiseArray.splice(0, limit);
        await Promise.all(batch)
            .then(values => result.push(...values))
            .catch(error => console.error("Error in batch request:", error));
    }
    return result;
}

// Function to search and save member data
function searchMembers() {
    var input = prompt("Input Mail Address(es)");
    var mailArray = input.trim().replace(/\r/g, "").split("\n");
    getMemberDataArrayPromiseLimit(mailArray)
        .then((memberDataArray) => {
            getCourseDataArrayPromiseLimit(memberDataArray)
                .then((courseDataArray) => {
                    saveAsJSON("", courseDataArray);
                });
        })
        .catch(error => {
            console.error("Error:", error);
        });
}