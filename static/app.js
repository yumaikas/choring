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
        ['body', {"border-radius": "5px"}],
        ['input', { 
            "min-width": "80%",
            "border": "1px solid black",
            "border-radius": "5px",
            "margin-bottom": "10px",
        }],
    ];

    function labeledField(display, id, attrs) {
        var evts = [
            ["onchange", "setInput", ["*"], {rawArgs: ["value"]}, id],
        ];
        return [
            ['label', {class:"label", for:id}, display],
            ['input', B.ev(attrs, evts)]
        ];
    }
    var createChoreView = function() {
        var inputs = {};
        var evts = [
            ["setInput", "*", function(x,value, id){
                console.log(arguments);
                inputs[id] = value;
            }],
            ["ajax", "loadNewChoresAndGoToEdit", function(x) {
                c.ajax('GET', '/chores', {}, '', function(err, resp) {
                    B.do('set', ['State', 'chore-view', 'chores'], resp.body)
                    B.do('navToView', ['*'], 'manageChores');
                });
            }],
            ["ajax", "saveChore", function(x, name, minDays, maxDays) {
                // TODO: Save picture as part of Ajax call, if it is defined
                c.ajax('POST', '/chores/create', {}, 
                    {
                        name: name,
                        minDays: minDays,
                        maxDays: maxDays,
                    },
                    function(err, resp) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        B.do('ajax', 'loadNewChoresAndGoToEdit');

                    }
                );
            }],
            ["validateChoreSubmit", "*", function() {
                console.log(inputs);
                var err = teishi.v('Save Chore', [
                    ['Chore name', inputs.chore_name, 'string', 'oneOf'],
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
        c.ajax('GET', '/chores', '', '', function(err, resp) {
            if (err) {
                console.log(err);
                return;
            }
            B.do('set', ['State', 'chore-view', 'chores'], resp.body)
        });
        var choreEvts = [
        ];
        return B.view(['State', 'chore-view'], {
            listen:choreEvts
        }, function(x) {
            var chores = B.get(['State', 'chore-view', 'chores']);
            return dale.do(chores, function(c) {
                return ['div', {"data-id": c.id}, c.description]
            });
        });
    };

    var setReminderView = function() {
        return B.view(['State','set-reminder'], function(x) {
            return ['div', "TODO: Editing chores will show up here." ];
        }); 
    }

    var profileView = function() { return B.view(['State', 'profile'], function(x) {
        return ['div', "TODO: Show User Profile here"];
    }); };

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
                console.log(arguments);
                B.do('set', ['State', 'currentView', 'name'], viewName)
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
                var title = "Chor'in";
                if (currView.name.length > 0) {
                    title = "Chor'in > " + currView.name;
                }
                return [ 
                    ['style', styles],
                    ['h2', [
                        ["a", B.ev({href:"#"}, retToNavEvts), title]]],
                    currView.targetView()
                ];
            }
        );
    };

    // TODO: Load this from localstorage
    B.set(['State', 'currentView', 'name'], 'nav');
    B.mount('#app', rootView());
});