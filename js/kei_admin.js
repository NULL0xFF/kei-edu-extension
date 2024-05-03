/** @returns {void} */
function saveAsJSON(fileName, data) {
    console.log("saveAsJSON(" + fileName + ", ... ) called");
    var fileContent = JSON.stringify(data);
    var bb = new Blob([fileContent], { type: "text/plain" });
    var a = document.createElement("a");

    a.download = fileName + "_" + new Date().toISOString() + ".json";
    a.href = window.URL.createObjectURL(bb);
    a.click();
}

/** @returns {Promise} */
function getMemberDataPromise(mailAddress = "") {
    return new Promise(function (resolve, reject) {
        var $form = jQuery("#memberSearchForm");
        $form[0].searchCsTitle.value = mailAddress;
        $form[0].searchListCnt.value = 100;
        jQuery("#pageIndex", $form).val(1);
        jQuery.ajax({
            url: "/user/member/selectMemberList.do",
            type: "post",
            data: $form.serialize(),
            datatype: "json",
            tryCount: 0,
            retryLimit: 3,
            async: true,
            success: function (data) {
                console.debug("resolved!");
                if (data.list.length == 0) {
                    console.error(mailAddress + " not found on server");
                    // reject(mailAddress + " not found on server");
                    resolve(null);
                } else {
                    var dataArray = new Array();
                    for (var i = 0; i < data.list.length; i++)
                        if (data.list[i].cxMemberEmail === mailAddress)
                            dataArray.push((({ csMemberSeq, csMemberId, csMemberName, cxMemberBirthday, cxMemberEmail, cxCompanyName, cxDepartmentName, cxDivisionCdName, csCertiType }) => ({ csMemberSeq, csMemberId, csMemberName, cxMemberBirthday, cxMemberEmail, cxCompanyName, cxDepartmentName, cxDivisionCdName, csCertiType }))(data.list[i]));
                    if (dataArray.length > 1) {
                        console.warn(mailAddress + " more than one entries found on server");
                        console.warn(dataArray);
                    } else if (dataArray.length == 0) {
                        console.error(mailAddress + " not found on server");
                        resolve(null);
                    }
                    resolve(dataArray);
                }
            },
            error: function (xhr, status, error) {
                console.log(status);
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

/** @returns {Promise} */
function getMemberDataArrayPromise(mailArray = []) {
    return new Promise((resolve, reject) => {
        console.info("resolving an array of " + mailArray.length + " entries");
        var memberDataPromiseArray = new Array();
        mailArray.forEach((mailAddress, mailArrayIndex, mailArray) => {
            memberDataPromiseArray.push(getMemberDataPromise(mailAddress));
        });
        Promise.all(memberDataPromiseArray)
            .then((memberDataArray) => {
                var filtered = memberDataArray.filter((entry) => {
                    return entry != null;
                });
                resolve(filtered);
            })
            .catch((err) => {
                console.error(err);
            });
    });
}

/**
 * limit the rate of ajax request aproximately by 1000(default)
 * 
 * @param {Array<String>}
 * @param {number}
 * @returns {Promise} 
 * */
async function getMemberDataArrayPromiseLimit(mailArray = [], limit = 1000) {
    if (mailArray.length > limit)
        return new Promise(async (resolve, reject) => {
            var firstPromise = await getMemberDataArrayPromiseLimit(mailArray.slice(0, mailArray.length / 2), limit);
            var secondPromise = await getMemberDataArrayPromiseLimit(mailArray.slice(mailArray.length / 2), limit);
            resolve(firstPromise.concat(secondPromise));
        });
    else
        return new Promise((resolve, reject) => {
            getMemberDataArrayPromise(mailArray)
                .then((memberDataArray) => {
                    resolve(memberDataArray);
                });
        });
}

/** @deprecated */
function getMemberDataArrayPromiseDeprecated(mailArray = []) {
    // getMemberDataArrayPromise(mailArray.slice(0, mailArray.length / 2))
    return new Promise(function (resolve, reject) {
        console.debug("mailArray.length = " + mailArray.length);
        if (mailArray.length > 500) {
            console.debug("array size larger than 500");
            console.debug("split into half");
            new Promise(function (resolve, reject) {
                console.debug("slice(0, " + mailArray.length / 2 + ")");
                console.debug("slice(" + mailArray.length / 2 + ")");
                var promiseList = [
                    getMemberDataArrayPromise(mailArray.slice(0, mailArray.length / 2)),
                    getMemberDataArrayPromise(mailArray.slice(mailArray.length / 2))
                ];
                Promise.all(promiseList).then((values) => {
                    console.debug("divided array(" + mailArray.length + ") resolved");
                    return (values);
                });
            }).then((values) => {
                console.debug(values);
                console.debug(values.length);
                console.debug("concatenating two array");
                var array = new Array();
                values.forEach(function (innerArray, innerArrayIndex, values) {
                    innerArray.forEach(function (element, elementIndex, innerArray) {
                        array.push(element);
                        console.debug("pushed");
                    });
                });
                console.debug("concatenated");
                resolve(array);
            });
        }
        else {
            new Promise(function (resolve, reject) {
                console.debug("resolving array(" + mailArray.length + ")");
                var promiseList = new Array();
                mailArray.forEach(function (mailAddress, mailArrayIndex, mailArray) {
                    promiseList.push(getMemberDataPromise(mailAddress));
                });
                Promise.all(promiseList).then((values) => {
                    console.debug("array(" + mailArray.length + ") resolved");
                    resolve(values);
                });
            }).then((values) => {
                resolve(values);
            });
        }
    });
}

/** @returns {Promise} */
function getCourseDataPromise(memberData) {
    return new Promise((resolve, reject) => {
        var $form = jQuery("#memberSearchForm");
        var result = "";
        var data = new Object();
        data.dspLinkMenuId = $("#dspLinkMenuId_member", $form).val();
        data.dspMenuId = $("#dspMenuId_member", $form).val();
        data.searchCsMemberSeq = memberData.csMemberSeq;
        jQuery.ajax({
            url: "/user/member/memberCourseHistoryPopup.do",
            type: "post",
            data: data,
            datatype: "html",
            tryCount: 0,
            retryLimit: 3,
            async: true,
            success: function (data) {
                result = cfn_trim(data.toString());
                jQuery("#applyRegArea").html(result);
                var $memberForm = jQuery("#memberSearchForm_member");
                $memberForm[0].searchListCnt_member.value = 100;
                $memberForm[0].searchCsMemberSeq_member.value = memberData.csMemberSeq;
                jQuery("#pageIndex_member", $memberForm).val(1);
                resolve(new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        url: "/user/member/selectMemberCourseHistoryPopup.do",
                        type: "post",
                        data: $memberForm.serialize(),
                        datatype: "json",
                        tryCount: 0,
                        retryLimit: 3,
                        async: true,
                        success: function (data) {
                            for (var i = 0; i < data.list.length; i++) {
                                data.list[i] = (({ csYear, csCategoryName, csTitle, csCompletionYn, studyStartDate, studyEndDate, openStartDate, openEndDate }) => ({ csYear, csCategoryName, csTitle, csCompletionYn, studyStartDate, studyEndDate, openStartDate, openEndDate }))(data.list[i]);
                            }
                            resolve(data);
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

/** @returns {Promise} */
function getCourseDataArrayPromise(memberDataArray = []) {
    return new Promise((resolve, reject) => {
        console.info("resolving an array of " + memberDataArray.length + " entries");
        var userDataPromiseArray = new Array();
        memberDataArray.forEach((memberData, memberDataArrayIndex, memberDataArray) => {
            userDataPromiseArray.push(getCourseDataPromise(memberData));
        });
        Promise.all(userDataPromiseArray)
            .then((userDataArray) => {
                var filtered = userDataArray.filter((entry) => {
                    return entry != null;
                });
                resolve(filtered);
            })
            .catch((err) => {
                console.error(err);
            });
    });
}

/**
 * limit the rate of ajax request aproximately by 1000(default)
 * 
 * @param {Array<String>}
 * @param {number}
 * @returns {Promise} 
 * */
async function getCourseDataArrayPromiseLimit(memberDataArray = [], limit = 1000) {
    if (memberDataArray.length > limit)
        return new Promise(async (resolve, reject) => {
            var firstPromise = await getCourseDataArrayPromiseLimit(memberDataArray.slice(0, memberDataArray.length / 2), limit);
            var secondPromise = await getCourseDataArrayPromiseLimit(memberDataArray.slice(memberDataArray.length / 2), limit);
            resolve(firstPromise.concat(secondPromise));
        });
    else
        return new Promise((resolve, reject) => {
            getCourseDataArrayPromise(memberDataArray)
                .then((userDataArray) => {
                    resolve(userDataArray);
                });
        });
}

/** @returns {void} */
function search() {
    var input = prompt("Input Mail Address(es)");
    mailArray = input.trim().replace(/\r/g, "").split("\n");
    getMemberDataArrayPromiseLimit(mailArray)
        .then((memberDataArray) => {
            getCourseDataArrayPromiseLimit(memberDataArray)
                .then((userDataArray) => {
                    saveAsJSON("", userDataArray);
                })
        });
}

console.log("KEI Administration Tool Script Loaded");