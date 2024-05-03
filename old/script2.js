function getMemberData(mailAddress = "") {
    var $form = jQuery("#memberSearchForm");
    $form[0].searchCsTitle.value = mailAddress;
    $form[0].searchListCnt.value = 100;
    jQuery("#pageIndex", $form).val(1);
    return new Promise(function (resolve, reject) {
        jQuery.ajax({
            url: "/user/member/selectMemberList.do",
            type: "post",
            data: $form.serialize(),
            datatype: "json",
            tryCount: 0,
            retryLimit: 3,
            async: true,
            success: function (data) {
                for (var i = 0; i < data.list.length; i++) {
                    if (data.list[i].cxMemberEmail === mailAddress)
                        resolve((({ csMemberSeq, csMemberId, csMemberName, cxMemberBirthday, cxMemberEmail, cxCompanyName, cxDepartmentName, cxDivisionCdName, csCertiType }) => ({ csMemberSeq, csMemberId, csMemberName, cxMemberBirthday, cxMemberEmail, cxCompanyName, cxDepartmentName, cxDivisionCdName, csCertiType }))(data.list[i]));
                }
            }, 
            error: function (xhr, status, error) {
                console.log(mailAddress);
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

function getCourseList(memberData) {
    var $form = jQuery("#memberSearchForm");
    var result = "";
    var data = new Object();
    data.dspLinkMenuId = $("#dspLinkMenuId_member", $form).val();
    data.dspMenuId = $("#dspMenuId_member", $form).val();
    data.searchCsMemberSeq = memberData.csMemberSeq;
    return new Promise(function (resolve, reject) {
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

async function massiveSearchCourseByEmail(chunk = 1000, p = 0, q = 0) {
    let mailArray = new Array();
    let mailChunkArray = new Array();
    var input = prompt("Input Mail Address(es)");
    mailArray = input.trim().replace(/\r/g, "").split("\n");

    for (p; p <= Math.min((mailArray.length / chunk), q); p++) {
        await bulkSearchCourseByMail(mailArray.slice(p * chunk, (p + 1) * chunk), p);
        await sleep(60000);
    }
}

async function bulkSearchCourseByMail(mailArray = [], fileName = "") {
    if (mailArray.length == 0) {
        var input = prompt("Input Mail Address(es)");
        mailArray = input.trim().replace(/\r/g, "").split("\n");
    }

    new Promise(function (resolve, reject) {
        var list = new Array();
        mailArray.forEach(function (mailAddress, mailArrayIndex, mailArray) {
            new Promise(function (resolve, reject) {
                console.log("resolving member");
                getMemberData(mailAddress).then(function (memberData) {
                    console.log("resolving course");
                    getCourseList(memberData).then(courseList => {
                        var user = {
                            member: memberData,
                            course: courseList.list
                        };
                        resolve(user);
                    });
                });
            }).then(function (user) {
                console.log("resolved");
                list.push(user);
                if (mailArrayIndex === mailArray.length - 1)
                    resolve(list);
            });
        });
    }).then(async function (list) {
        await sleep(1000);
        saveAsJSON(fileName, list);
    });
}

////////////////////////////////////////////////////////////////////////////////

console.log("script2");