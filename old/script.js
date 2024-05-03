function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function getMemberIDList(search = "") {
    // console.log("getMemberID(" + search + ") called");

    // Get #memberSearchForm from KEI
    var $form = jQuery("#memberSearchForm");
    $form[0].searchCsTitle.value = search;
    $form[0].searchListCnt.value = 100; // Pre-defined search count (one page)
    jQuery("#pageIndex", $form).val(1); // Set search page index to 1

    // Create a list of Promises
    return new Promise(function (resolve, reject) {
        jQuery.ajax({
            url: "/user/member/selectMemberList.do",
            type: "post",
            data: $form.serialize(),
            datatype: "json",
            async: true,
            success: function (data) {
                var list = new Array();
                for (var index = 0; index < data.list.length; index++) {
                    if (data.list[index].cxMemberEmail === search)
                        list.push(data.list[index].csMemberSeq);
                }
                resolve(list);
            }, error: function (xhr, status, error) {
                reject(xhr, status, error);
            }
        });
    });
}

function getMemberCourseListByID(memberID = 0) {
    // console.log("getMemberCourseListByID(" + memberID + ") called");

    var $form = jQuery("#memberSearchForm");
    var result = "";
    var data = new Object();

    data.dspLinkMenuId = $("#dspLinkMenuId_member", $form).val();
    data.dspMenuId = $("#dspMenuId_member", $form).val();
    data.searchCsMemberSeq = memberID;

    return new Promise(function (resolve, reject) {
        jQuery.ajax({
            url: "/user/member/memberCourseHistoryPopup.do",
            type: "post",
            data: data,
            datatype: "html",
            async: true,
            success: function (data) {
                result = cfn_trim(data.toString());

                jQuery("#applyRegArea").html(result);

                var $memberForm = jQuery("#memberSearchForm_member");
                $memberForm[0].searchListCnt_member.value = 100;
                $memberForm[0].searchCsMemberSeq_member.value = memberID;

                jQuery("#pageIndex_member", $memberForm).val(1);

                jQuery.ajax({
                    url: "/user/member/selectMemberCourseHistoryPopup.do",
                    type: "post",
                    data: $memberForm.serialize(),
                    datatype: "json",
                    async: true,
                    success: function (data) {
                        resolve(data);
                    }, error: function (xhr, status, error) {
                        reject(xhr, status, error);
                    }
                });
            }, error: function (xhr, status, error) {
                reject(xhr, status, error);
            }
        });
    });
}

async function wrapSearch() {
    let arr = new Array();
    var input = prompt("wrap");
    var chunk = 500;

    arr = input.trim().replace(/\r/g, "").split("\n");

    for (var i = 0; i <= arr.length / chunk; i++) {
        // var check = false;
        // do {
        console.log(arr.slice(i * chunk, (i + 1) * chunk));
        search(arr.slice(i * chunk, (i + 1) * chunk), i);
        await sleep(30000);
        // check = prompt("is it successful? (true/false)");
        //     if (check === true)
        //         break;
        // } while (check === false);
    }
}

function search(input = "", naming = "") {

    let arr = new Array();
    var include = "";

    if (input === undefined) {
        input = prompt("Input");
        arr = input.trim().replace(/\r/g, "").split("\n");
    } else {
        arr = input;
    }
    // include = prompt("Include").trim();

    new Promise(function (resolve, reject) {
        var list = new Array();
        arr.forEach(function (value, index, array) {
            // console.log(value);
            new Promise(function (resolve, reject) {
                getMemberIDList(value).then(function (IDList) {
                    var listIndex = 0;
                    if (IDList == null) {
                        console.error(value + " not found");
                        return;
                    }
                    if (IDList.length == 0) {
                        console.error(value + " no list");
                        return;
                    }
                    if (IDList.length > 1) {
                        console.error(value + " multiple id");
                        console.log(IDList);
                        // listIndex = prompt("Select");
                        return;
                    }
                    var user;
                    console.log(value);
                    getMemberCourseListByID(IDList[listIndex]).then(function (CourseList) {
                        user = {
                            name: value,
                            course: []
                        };
                        for (var i = 0; i < CourseList.list.length; i++) {
                            CourseList.list[i] = (({ csYear, csCategoryName, csTitle, csCompletionYn, studyStartDate, studyEndDate, openStartDate, openEndDate }) => ({ csYear, csCategoryName, csTitle, csCompletionYn, studyStartDate, studyEndDate, openStartDate, openEndDate }))(CourseList.list[i]);
                        }
                        user.course = CourseList.list;
                        resolve(user);
                    });
                });
            }).then(function (user) {
                list.push(user);
                console.log("resolved");
                if (index === array.length - 1)
                    resolve(list);
            });
        });
    }).then(async function (list) {
        list = list.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
        await sleep(5000)
        saveAsJSON(naming, list);
    });
    // for (var arrIndex = 0; arrIndex < arr.length;) {
    //     console.log("for[" + arrIndex + "]");
    //     new Promise(function (resolve, reject) {
    //         console.log("Promise02");
    //         getMemberIDList(arr[arrIndex]).then(function (IDList) {
    //             new Promise(function (resolve, reject) {
    //                 console.log("Promise03");
    //                 var user;
    //                 console.log("Promise03 resolve");
    //                 resolve(user);
    //             }).then(function (user) {
    //                 console.log("Promise02 resolve");
    //                 resolve(user);
    //             });
    //         });
    //     }).then(function (user) {
    //         list.push(user);
    //         console.log(arrIndex);
    //         if (arrIndex === arr.length - 1) {
    //             console.log("Promise01 resolve");
    //             resolve(list);
    //         }
    //     });
    //     arrIndex++;
    // }

    // new Promise(function (resolve, reject) {
    //     var list = new Array();
    //     arr.forEach(function (value, index, array) {
    //         new Promise(function (resolve, reject) {
    //             getMemberIDList(value).then(function (IDList) {
    //                 new Promise(function (resolve, reject) {
    //                     var user;
    //                     IDList.forEach(function (ID, ID_Index, ID_Array) {
    //                         getMemberCourseListByID(ID).then(function (CourseList) {
    //                             user = {
    //                                 name: value,
    //                                 courseList: CourseList.list
    //                             };
    //                         }).then(function () {
    //                             if (ID_Index === ID_Array.length - 1) resolve(user);
    //                         });
    //                     });
    //                 }).then(function (user) {
    //                     list.push(user);
    //                 });
    //             });
    //             if (index === array.length - 1) resolve(list);
    //         }).then(function (rList) {
    //             resolve(rList);
    //         });
    //     });
    // }).then(function (rList) {
    //     saveAsJSON("", rList);
    // });
}

function saveAsJSON(fileName, output) {
    console.log("saveAsJSON(" + fileName + ", ... ) called");
    var fileContent = JSON.stringify(output);
    var bb = new Blob([fileContent], { type: "text/plain" });
    var a = document.createElement("a");

    a.download = fileName + "_" + new Date().toISOString() + ".json";
    a.href = window.URL.createObjectURL(bb);
    a.click();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

console.log("Script Loaded!");