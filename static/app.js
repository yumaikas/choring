c.ready(function(){
    var schedules = [{
            id: 1,
            minDays: 5.0,
            maxDays: 10.0
    }];

    var posts = [
        {
            id: 1,
            chore_id: 1,
            content: "",
            time: new Date(2020, 4, 8, 10, 10, 0),
            postType: "ptChoreDone"
        }
    ];

    var chores = [ {
        id: 1,
        description: "Water Succulent",
        featured_picture_id: 1,
        schedule_id: 1
    }];

    var styles = [
        [".btn-choreadd",{
            "font-size": "large",
            display: "block",
            "margin-top": "10px",
        }],
        [".label", {
            display: "block",
        }],
        [".block", {
            display: "block",
        }],
        ["h4.message", {
            "min-width": "50%",
            "padding": "8px",
            "border": "1px solid black",
            "border-radius": "5px",
        }],
        [".center", {
            "display": "block",
            "margin": "auto",
        }],
        [".message div", {
            "margin-bottom": "10px",
        }],
        [".message.info", {
            "color": "blue"
        }],
        [".message.warning", {
            "color": "yellow"
        }],
        [".message.error", {
            "color": "red"
        }],
        ['body', {"border-radius": "5px"}],
        ['input', { 
            "min-width": "80%",
            "border": "1px solid black",
            "border-radius": "5px",
            "margin-bottom": "10px",
        }],
    ];

    function labeledField(display, id, attrs) {
        attrs.id = id;
        var evts = [
            ["onchange", "setInput", ["*"], {rawArgs: ["value"]}, id],
        ];
        return [
            ['label', {class:"label", for:id}, display],
            ['input', B.ev(attrs, evts)]
        ];
    }

    function loadChores(json) {
        return dale.do(json, function(x) {
            var ms = x.lastPerformed;
            x.lastPerformed = new Date(x);
            return x;
        })
    }
    window.flash = function flash(message, level) {
        B.do("flashMessage", "show", message, level || "info");
    }
    window.dismiss = function dismiss() {
        B.do("flashMessage", "dismiss");
    }
    var createChoreView = function() {
        var inputs = {};
        var evts = [
            ["setInput", "*", function(x, value, id){
                console.log(arguments);
                inputs[id] = value;
            }],
            ["ajax", "loadNewChoresAndGoToEdit", function(x) {
                c.ajax('GET', '/chores', {}, '', function(err, resp) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    B.do('set', ['State', 'chore-view', 'chores'], loadChores(resp.body))
                    B.do('navToView', ['*'], 'manageChores');
                });
            }],
            ["ajax", "saveChoreImage", function(x, imageElem, name, minDays, maxDays) {
                var f = new FormData();
                f.append("file", imageElem.slice(), imageElem.name);
                c.ajax('POST', '/picture/upload', {}, f, function(err, resp) {
                    if (err) {
                        flash("There was a problem saving the photo. Try again, if that doesn't work, bug Andrew","error");
                        return;
                    }
                    var imageId = parseInt(resp.body, 10);
                    B.do('ajax', 'saveChoreData', imageId, name, minDays, maxDays);
                });
            }],
            ["ajax", "saveChoreData", function(x, imageId, name, minDays, maxDays) {
                var args = {
                    name: name,
                    minDays: parseFloat(minDays),
                    maxDays: parseFloat(maxDays),
                    pictureId: imageId || -1,
                };
                if (imageId) {
                    args.image = imageId;
                }

                c.ajax('POST', '/chores/create', {}, 
                    args,
                    function(err, resp) {
                        if (err) {
                            console.log(err);
                            flash("Something went wrong while trying to save the chore. Try again, if that doesn't work, bug Andrew.", "error")
                            return;
                        }
                        B.do('ajax', 'loadNewChoresAndGoToEdit');
                    }
                );
            }],
            ["ajax", "saveChore", function(x, name, minDays, maxDays) {
                // TODO: Save picture as part of Ajax call, if it is defined
                var imElem = c("#chore-photo");
                if (imElem.files.length > 0) {
                    B.do('ajax', "saveChoreImage", imElem.files[0], name, minDays, maxDays);
                } else {
                    B.do('ajax', 'saveChoreData', -1, name, minDays, maxDays);
                }
            }],
            ["validateChoreSubmit", "*", function() {
                inputs.chore_name = inputs.chore_name || c("#chore_name").value;
                inputs.chore_maxDays = inputs.chore_maxDays || c("#chore_maxDays").value;
                inputs.chore_minDays = inputs.minDays || c("#chore_minDays").value;

                var err = teishi.v('Save Chore', [
                    ['Chore name', inputs.chore_name , 'string', 'oneOf'],
                    ['Chore at least days', inputs.chore_minDays, {min: 1, max: 10000}, teishi.test.range],
                    ['Chore at most days', inputs.chore_maxDays, {min: 1, max: 10000}, teishi.test.range],
                ], true);
                if (err !== true) {
                    // !TODO: figure out a more friendly error message here.
                    B.do('set', ['State', 'chore-create', 'error'], err);
                    console.log(err);
                } else {
                    B.do('set', ['State', 'chore-create', 'error'], null);
                    B.do('ajax', 'saveChore', inputs.chore_name, inputs.chore_minDays, inputs.chore_maxDays);
                }
            }]
        ];

        function addChoreBtn() {
            var evts = [
                ["onclick", "validateChoreSubmit", ["*"]]
            ];
            return ["button", B.ev({class: "btn-choreadd"}, evts), "Save Chore"];
        }

        return B.view(
            ['State', 'chore-create'], 
            {listen: evts},
            function(x) {
                var err= B.get(['State', 'chore-create', 'error']) || [''];
                return ['div', 
                    [
                        labeledField("What is the chore called?", "chore_name", {type:"text"}),
                        ["h4", "How many days before you need to do it again?"],
                        labeledField("At least", "chore_minDays", {type:"text"}),
                        labeledField("At most", "chore_maxDays", {type:"text"}),
                        labeledField("Picture (Optional)", "chore-photo", {
                            type:"file", 
                            id: "chore-photo",
                            "accept": "*.jpeg,*.png,image/*"
                        }),
                        err,
                        addChoreBtn(),
                    ]
                ];
            }
        );
    }

    var todayView = function() {
        return B.view(['State', 'today-view'], function(x) {
            return ['div', "TODO: Chores that should be started today will show up here." ];
        });
    };

    var manageChoresView = function() {
        B.set(['State', 'chore-view', 'loading'], true);
        B.set(['State', 'chore-view', 'shownChore'], null);
        c.ajax('GET', '/chores', '', '', function(err, resp) {
            if (err) {
                console.log(err);
                flash(
                    "Something went wrong trying to get chores. Bug Andrew about this",
                    5000,
                    "error"
                );
                return;
            }
            B.set(['State', 'chore-view', 'loading'], false);
            B.do('set', ['State', 'chore-view', 'chores'], loadChores(resp.body))
        });
        var choreEvts = [
            ['showChore', '*', function(x, id) {
                console.log(arguments);
                var chores = B.get(['State', 'chore-view', 'chores']);
                var c = null;
                dale.stop(chores, id, function(x){
                    c = x; return c.id;
                });
                B.do('set', ['State', 'chore-view', 'shownChore'], c);
                B.do('change', ['State', 'chore-view']);
            }],
        ];
        return B.view(['State', 'chore-view'], {
            listen:choreEvts
            }, function(x) {
                var isLoading = B.get(['State', 'chore-view', 'loading']);
                var chores = B.get(['State', 'chore-view', 'chores']);
                var shownChore = B.get(['State', 'chore-view', 'shownChore']);
                if (isLoading) {
                    return ["Loading chores..."];
                }
                var shownChoreLith = [];
                if (shownChore) {
                    var imageLith = [];
                    if (shownChore.pictureId > 0) {
                        imageLith = ["img", {
                            src: "/picture/" + shownChore.pictureId, 
                            style: "max-width:90%"
                        }, shownChore.description];
                    }
                    shownChoreLith = [
                        ["h4", shownChore.description],
                        imageLith,
                        ["div", ["Do this every ", shownChore.minDays, " to  ", shownChore.maxDays, " days."]],
                        ["hr"]
                    ];
                }

                return [
                    shownChoreLith,
                    dale.do(chores, function(c) {
                        var evts = [
                            ['onclick', 'showChore', '*', c.id]
                        ];
                        var attr = { href:"#", class:"block", "data-id": c.id};
                        return ['a', B.ev(attr, evts), c.description];
                    })
                ];
        });
    };

    var setReminderView = function() {
        return B.view(['State','set-reminder'], function(x) {
            return ['div', "TODO: Editing chores will show up here." ];
        }); 
    }

    var profileView = function() { 
        return B.view(['State', 'profile'], function(x) {
            return ['div', "TODO: Show User Profile here"];
        }); 
    };

    var views = [ 
        {name: 'Today', id:"today", targetView: todayView }, 
        {name: 'Add Chore', id:"createChore", targetView: createChoreView}, 
        {name: 'Edit Chores', id:"manageChores", targetView: manageChoresView}, 
        {name: 'Set reminder', id:"setReminder", targetView: setReminderView}, 
        {name: 'Profile', id: "profile", targetView: profileView }, 
    ];


    var navView = function() {
        return B.view(['State', 'currentView', 'nav'], 
        function(x) {
            return ['ul', dale.do(views, function(it) {
                var evts = [ 
                    ['onclick', 'navToView', ['*'], it.id]
                ];
                return ['li', ['h4', 
                    ['a', B.ev({href:"#"}, evts), it.name]
                ]];
            })];
        })
    };

    var nav = {
        name: "", id:"nav", targetView: navView 
    };

    var rootView = function() {
        var events = [
            ['navToView', '*', function(x, viewName) {
                B.do('set', ['State', 'currentView', 'name'], viewName)
            }],
            ['flashMessage', 'show', function(x, message, time, level) {
                B.do('set', ['State', 'currentView', 'flash'], { message: message, level: level })
                // Default to 10 seconds
            }],
            ['flashMessage', 'dismiss', function() {
                B.do('set', ['State', 'currentView', 'flash'], null);
            }]
        ];

        return B.view(['State', 'currentView'], 
            {listen: events},
            function(x) {
                console.log(arguments);
                var currViewName = B.get(['State', 'currentView', 'name']);
                var currView;

                if (currViewName == "nav") {
                    currView = nav;
                } else {
                    dale.stop(views, currViewName, function(v) {
                        currView = v;
                        return v.id;
                    });
                }
                var retToNavEvts = [
                    ['onclick', 'navToView', ['*'], "nav"]
                ];
                var flash = B.get(['State', 'currentView', 'flash']);
                var flashDisp = [];
                if (flash) {
                    flashDisp = [
                        ['h4', {class:"block message " + flash.level}, 
                        [
                            ["div", flash.message],
                            ["a", B.ev({href: "#", class:"center"}, ["onclick", "flashMessage", "dismiss"] ), "Ok"]
                        ]
                    ]
                ];
                }
                var title = "Chor'in";
                if (currView.name.length > 0) {
                    title = "Chor'in > " + currView.name;
                }
                return [ 
                    ['style', styles],
                    ['h2', [
                        ["a", B.ev({href:"#", class: "block"}, retToNavEvts), title]]],
                    flashDisp,
                    currView.targetView()
                ];
            }
        );
    };

    // TODO: Load this from localstorage
    B.set(['State', 'currentView', 'name'], 'nav');
    B.mount('#app', rootView());
});