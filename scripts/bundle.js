(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {
  var root = this,
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {
    return {
      keys: Object.keys || function (obj) {
        if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
          throw new TypeError("keys() called on a non-object");
        }
        var key, keys = [];
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys[keys.length] = key;
          }
        }
        return keys;
      },

      uniqueId: function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            iterator.call(context, obj[i], i, obj);
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              iterator.call(context, obj[key], key, obj);
            }
          }
        }
      },

      once: function(func) {
        var ran = false, memo;
        return function() {
          if (ran) return memo;
          ran = true;
          memo = func.apply(this, arguments);
          func = null;
          return memo;
        };
      }
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  }else if (typeof define === "function") {
    define(function() {
      return Events;
    });
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],2:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":1}],3:[function(require,module,exports){
"use strict";
module.exports = colorStyleForPlayer;
function colorStyleForPlayer(player) {
  var numColors = 10;
  var offset = 8;
  var mult = 3;
  var colorNum = Math.abs(hashString(player) * mult + offset) % (numColors) + 1;
  return ("namelet-" + colorNum);
}
function getColorFromString(player) {
  var colors = ["#c0392b", "#27ae60", "#3498db", "#9b59b6", "#f1c40f", "#e67e22", "#e74c3c"];
  return colors[hashString(player) % colors.length];
}
function hashString(str) {
  var hash = 0,
      i,
      chr,
      len;
  if (str.length == 0)
    return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}


//# sourceURL=/home/miles/code/reactance/scripts/color.js
},{}],4:[function(require,module,exports){
"use strict";
var BackboneEvents = require("backbone-events-standalone");
module.exports = Dispatcher;
function Dispatcher() {
  this._eventer = BackboneEvents.mixin({});
}
Dispatcher.prototype.dispatch = function(action, payload) {
  if (_.isString(action)) {
    payload = _.extend({action: action}, payload);
  } else {
    payload = action;
  }
  console.log(("dispatch: " + payload.action));
  this._eventer.trigger('action', payload);
};
Dispatcher.prototype.bake = function(action, field) {
  return function(input) {
    var payload = {action: action};
    if (field != undefined) {
      payload[field] = input;
    }
    this.dispatch(payload);
  }.bind(this);
};
Dispatcher.prototype.onAction = function(callback) {
  this._eventer.on('action', callback);
};
Dispatcher.prototype.offAction = function(callback) {
  this._eventer.off('action', callback);
};


//# sourceURL=/home/miles/code/reactance/scripts/dispatcher.js
},{"backbone-events-standalone":2}],5:[function(require,module,exports){
"use strict";
var Store = require('./store');
module.exports = GameState;
function GameState(dispatcher) {
  Store.mixin(this);
  this.playerNames = ['Miles', 'Jess', 'Andres', 'Carolyn', 'Dr\u00fcck', 'Taylor', 'Akshat'];
  this.settings = {
    merlin: true,
    mordred: false,
    percival: false,
    morgana: false,
    oberon: false
  };
  this.roles = null;
  this.disabledReason = null;
  this.updateRoles();
  dispatcher.onAction(function(payload) {
    var actions = GameState.actions;
    if (_.isFunction(actions[payload.action])) {
      actions[payload.action].call(this, payload);
      this.save();
    }
  }.bind(this));
}
var PERSIST_KEYS = ['playerNames', 'settings', 'roles', 'disabledReason'];
GameState.prototype.save = function() {
  var $__0 = this;
  var persist = {};
  PERSIST_KEYS.forEach((function(key) {
    return persist[key] = $__0[key];
  }));
  store.set('store.gamestate', persist);
};
GameState.prototype.load = function() {
  var $__0 = this;
  var persist = store.get('store.gamestate');
  if (persist !== undefined) {
    PERSIST_KEYS.forEach((function(key) {
      return $__0[key] = persist[key];
    }));
  }
  this.updateRoles();
};
GameState.prototype.getRole = function(name) {
  var $__0 = this;
  if (this.roles === null)
    return null;
  var role = _.extend({}, this.roles[name]);
  if (role.spy) {
    role.otherSpies = _.filter(this.getSpies(), (function(theirName) {
      return !$__0.roles[theirName].oberon && name != theirName;
    }));
    if (this.settings.oberon) {
      role.hasOberon = true;
    }
  }
  if (role.merlin) {
    role.spies = _.filter(this.getSpies(), (function(name) {
      return !$__0.roles[name].mordred;
    }));
  }
  if (role.percival) {
    role.merlins = this.getMerlins();
  }
  return role;
};
GameState.prototype.getSpies = function() {
  var $__0 = this;
  return _.filter(this.playerNames, (function(name) {
    return $__0.roles[name].spy;
  }));
};
GameState.prototype.getMerlins = function() {
  var $__0 = this;
  return _.filter(this.playerNames, (function(name) {
    return $__0.roles[name].morgana || $__0.roles[name].merlin;
  }));
};
GameState.prototype.assignRoles = function() {
  var $__0 = this;
  var numPlayers = this.playerNames.length;
  var numSpies = {
    5: 2,
    6: 2,
    7: 3,
    8: 3,
    9: 3,
    10: 4
  }[numPlayers];
  var shuffledNames = _.shuffle(this.playerNames);
  this.roles = {};
  shuffledNames.forEach((function(name, i) {
    $__0.roles[name] = {spy: i < numSpies};
  }));
  var unassignedSpies = shuffledNames.slice(0, numSpies);
  var unassignedResistance = shuffledNames.slice(numSpies);
  if (this.settings.merlin) {
    var merlinName = unassignedResistance[0];
    unassignedResistance.splice(0, 1);
    this.roles[merlinName].merlin = true;
  }
  if (this.settings.morgana) {
    var morganaName = unassignedSpies[0];
    unassignedSpies.splice(0, 1);
    this.roles[morganaName].morgana = true;
  }
  if (this.settings.percival) {
    var percivalName = unassignedResistance[0];
    unassignedResistance.splice(0, 1);
    this.roles[percivalName].percival = true;
  }
  if (this.settings.mordred) {
    var mordredName = unassignedSpies[0];
    unassignedSpies.splice(0, 1);
    this.roles[mordredName].mordred = true;
  }
  if (this.settings.oberon) {
    var oberonName = unassignedSpies[0];
    unassignedSpies.splice(0, 1);
    this.roles[oberonName].oberon = true;
  }
  this.emitChange();
};
GameState.prototype.updateRoles = function(clear) {
  if (clear) {
    this.roles = null;
  }
  if (this.roles !== null)
    return;
  if (this.playerNames.length < 5) {
    this.disabledReason = 'tooFew';
  } else if (this.playerNames.length > 10) {
    this.disabledReason = 'tooMany';
  } else if (this.playerNames.length < 7 && this.settings.mordred && this.settings.morgana && this.settings.oberon) {
    this.disabledReason = 'tooFew';
  } else {
    this.disabledReason = null;
    this.assignRoles();
  }
};
GameState.actions = {};
GameState.actions.addPlayer = function($__1) {
  var name = $__1.name;
  if (!_.contains(this.playerNames, name)) {
    this.playerNames.push(name);
    this.updateRoles(true);
    this.emitChange();
  }
};
GameState.actions.deletePlayer = function($__1) {
  var name = $__1.name;
  this.playerNames = _.without(this.playerNames, name);
  this.updateRoles(true);
  this.emitChange();
};
GameState.actions.changeSettings = function($__1) {
  var settings = $__1.settings;
  _.extend(this.settings, settings);
  this.updateRoles(true);
  this.emitChange();
};
GameState.actions.newRoles = function() {
  this.updateRoles(true);
};


//# sourceURL=/home/miles/code/reactance/scripts/game-state.js
},{"./store":20}],6:[function(require,module,exports){
"use strict";
var Tabs = React.createFactory(require('./tabs.jsx'));
var SetupPage = React.createFactory(require('./setup-page.jsx'));
var RolesPage = React.createFactory(require('./roles-page.jsx'));
var MissionPage = React.createFactory(require('./mission-page.jsx'));
var Dispatcher = require('./dispatcher');
var UIState = require('./ui-state');
var GameState = require('./game-state');
var MissionState = require('./mission-state');
var store_reset = require('./store-reset');
var dispatcher = new Dispatcher();
var dispatch = dispatcher.dispatch.bind(dispatcher);
var uistate = new UIState(dispatcher);
var gamestate = new GameState(dispatcher);
var missionstate = new MissionState(dispatcher);
store_reset(3);
uistate.load();
gamestate.load();
missionstate.load();
var renderApp = function() {
  var setupPage = SetupPage({
    playerNames: gamestate.playerNames,
    settings: gamestate.settings,
    onAddName: dispatcher.bake('addPlayer', 'name'),
    onDeleteName: dispatcher.bake('deletePlayer', 'name'),
    onChangeSettings: dispatcher.bake('changeSettings', 'settings'),
    onNewRoles: dispatcher.bake('newRoles')
  });
  var rolesPage = RolesPage({
    disabledReason: gamestate.disabledReason,
    playerNames: gamestate.playerNames,
    selectedPlayer: uistate.selectedPlayer,
    selectedRole: gamestate.getRole(uistate.selectedPlayer),
    selectionConfirmed: uistate.selectionConfirmed,
    onClickShow: dispatcher.bake('selectPlayer', 'name'),
    onClickConfirm: dispatcher.bake('confirmPlayer', 'name'),
    onClickCancel: dispatcher.bake('deselectPlayer'),
    onClickOk: dispatcher.bake('deselectPlayer', 'name')
  });
  var missionPage = MissionPage({
    numPlayers: gamestate.playerNames.length,
    passes: missionstate.passes,
    fails: missionstate.fails,
    history: missionstate.history,
    revealed: uistate.missionRevealed,
    onVote: dispatcher.bake('missionVote', 'pass'),
    onReveal: dispatcher.bake('missionReveal'),
    onReset: dispatcher.bake('missionReset')
  });
  React.render(Tabs({
    activeTab: uistate.tab,
    onChangeTab: dispatcher.bake('changeTab', 'tab'),
    tabs: {
      setup: {
        name: 'Setup',
        content: setupPage
      },
      roles: {
        name: 'Roles',
        content: rolesPage
      },
      mission: {
        name: 'Mission',
        content: missionPage
      }
    }
  }), document.getElementById('app'));
};
React.initializeTouchEvents(true);
renderApp();
uistate.onChange(renderApp);
gamestate.onChange(renderApp);
missionstate.onChange(renderApp);


//# sourceURL=/home/miles/code/reactance/scripts/index.js
},{"./dispatcher":4,"./game-state":5,"./mission-page.jsx":8,"./mission-state":9,"./roles-page.jsx":15,"./setup-page.jsx":17,"./store-reset":19,"./tabs.jsx":21,"./ui-state":22}],7:[function(require,module,exports){
/** @jsx React.DOM */

var PT = React.PropTypes

var LabeledNumber = React.createClass({displayName: "LabeledNumber",
    propTypes: {
        num: PT.number.isRequired,
        name: PT.string.isRequired,
    },

    render: function() {
        return React.createElement("figure", {className: "labeled-number"}, 
            this.props.num, 
            React.createElement("figcaption", null, this.props.name)
        )
    },
});

module.exports = LabeledNumber


},{}],8:[function(require,module,exports){
/** @jsx React.DOM */

var LabeledNumber = require('./labeled-number.jsx')
var PT = React.PropTypes
var cx = classnames

var MissionPage = React.createClass({displayName: "MissionPage",
    propTypes: {
        numPlayers: PT.number.isRequired,
        passes: PT.number.isRequired,
        fails:  PT.number.isRequired,
        history: PT.array.isRequired,
        revealed:  PT.bool.isRequired,
        onVote:  PT.func.isRequired,
        onReset:  PT.func.isRequired,
        onReveal:  PT.func.isRequired,
    },

    render: function() {
        var missionNumbers = this.renderMissionNumbers()
        if (this.props.revealed) {
            var passLabel = this.props.passes === 1 ? "Pass" : "Passes"
            var failLabel = this.props.fails === 1 ? "Fail" : "Fails"

            return React.createElement("div", {className: "mission-page revealed"}, 
                missionNumbers, 
                React.createElement("div", {className: "vote-holder"}, 
                    React.createElement(LabeledNumber, {
                        name: passLabel, 
                        num: this.props.passes}), 
                    React.createElement(LabeledNumber, {
                        name: failLabel, 
                        num: this.props.fails})
                ), 
                React.createElement("button", {
                    className: "reset", 
                    onClick: this.props.onReset}, 
                    "Reset")
            )
        } else {
            var votes = this.props.passes + this.props.fails
            Math.random()
            var side = Math.random() > 0.5
            return React.createElement("div", {className: "mission-page"}, 
                missionNumbers, 
                React.createElement(LabeledNumber, {
                    name: "Votes", 
                    num: votes}), 
                this.renderVoteButton(side), 
                this.renderVoteButton(!side), 
                React.createElement("button", {
                    className: "reset", 
                    onClick: this.props.onReset}, 
                    "Reset"), 
                React.createElement("div", {className: "reveal-container"}, 
                    React.createElement("button", {className: "reveal", 
                        onClick: this.props.onReveal}, 
                        "Show Votes")
                )
            )
        }
    },

    renderMissionNumbers: function() {
        var playerCountsMapping = {
            5: ["2", "3", "2", "3", "3"],
            6: ["2", "3", "4", "3", "4"],
            7: ["2", "3", "3", "4*", "4"],
            8: ["3", "4", "4", "5*", "5"],
            9: ["3", "4", "4", "5*", "5"],
            10: ["3", "4", "4", "5*", "5"],
        }
        var playerCounts = playerCountsMapping[this.props.numPlayers]
        var history = this.props.history

        if (playerCounts === undefined) {
            return null
        }

        var digits = playerCounts.map(function(n, i) {
            var played = history.length > i
            var passed = history[i]==0 || (history[i]==1 && playerCounts[i].indexOf("*")!=-1)
            return React.createElement("span", {key: i, className: cx({
                'pass': played && passed,
                'fail': played && !passed,
                'current': history.length ===i,
                'num': true,
            })}, playerCounts[i])
        })

        return React.createElement("div", {className: "mission-numbers"}, 
            digits
        )
    },

    renderVoteButton: function(pass) {
        var label = pass ? "Pass" : "Fail"
        return React.createElement("div", {key: label, className: "vote-container"}, 
            React.createElement("button", {
                className: cx({
                    'pass': pass,
                    'fail': !pass,
                    'secret-focus': true,
                }), 
                "data-pass": pass, 
                onClick: this.onVote}, 
                label)
        )
    },

    onVote: function(e) {
        var pass = e.target.dataset.pass === "true"
        this.props.onVote(pass)
    },
});

module.exports = MissionPage


},{"./labeled-number.jsx":7}],9:[function(require,module,exports){
"use strict";
var Store = require('./store');
module.exports = MissionState;
function MissionState(dispatcher) {
  Store.mixin(this);
  this.passes = 0;
  this.fails = 0;
  this.history = [];
  dispatcher.onAction(function(payload) {
    var actions = MissionState.actions;
    if (_.isFunction(actions[payload.action])) {
      actions[payload.action].call(this, payload);
      this.save();
    }
  }.bind(this));
}
var PERSIST_KEYS = ['passes', 'fails', 'history'];
MissionState.prototype.save = function() {
  var $__0 = this;
  var persist = {};
  PERSIST_KEYS.forEach((function(key) {
    return persist[key] = $__0[key];
  }));
  store.set('store.missionstate', persist);
};
MissionState.prototype.load = function() {
  var $__0 = this;
  var persist = store.get('store.missionstate');
  if (persist !== undefined) {
    PERSIST_KEYS.forEach((function(key) {
      return $__0[key] = persist[key];
    }));
  }
};
MissionState.prototype.resetMission = function() {
  this.passes = 0;
  this.fails = 0;
  this.emitChange();
};
MissionState.prototype.resetMissionHistory = function() {
  this.history = [];
  this.resetMission();
};
MissionState.actions = {};
MissionState.actions.missionVote = function($__1) {
  var pass = $__1.pass;
  if (pass) {
    this.passes += 1;
  } else {
    this.fails += 1;
  }
  this.emitChange();
};
MissionState.actions.missionReset = function() {
  this.resetMission();
};
MissionState.actions.addPlayer = function($__1) {
  var name = $__1.name;
  this.resetMissionHistory();
};
MissionState.actions.deletePlayer = function($__1) {
  var name = $__1.name;
  this.resetMissionHistory();
};
MissionState.actions.changeSettings = function($__1) {
  var settings = $__1.settings;
  this.resetMissionHistory();
};
MissionState.actions.newRoles = function() {
  this.resetMissionHistory();
};
MissionState.actions.missionReveal = function() {
  this.history.push(this.fails);
};


//# sourceURL=/home/miles/code/reactance/scripts/mission-state.js
},{"./store":20}],10:[function(require,module,exports){
/** @jsx React.DOM */

var colorStyleForPlayer = require('./color.js')
var PT = React.PropTypes
var cx = classnames

var Namelet = React.createClass({displayName: "Namelet",
    propTypes: {
        name: PT.string.isRequired,
    },

    render: function() {
        var name = this.props.name
        var styles = {'namelet': true}
        if (this.props.name !== "") {
            styles[colorStyleForPlayer(name)] = true
        }
        return React.createElement("div", {className: cx(styles)}, name[0])
    },

});

module.exports = Namelet


},{"./color.js":3}],11:[function(require,module,exports){
/** @jsx React.DOM */

var Namelet = require('./namelet.jsx')
var PT = React.PropTypes

var NewName = React.createClass({displayName: "NewName",
    propTypes: {
        onAddName: PT.func,
    },

    getInitialState: function() {
        return {text: ''}
    },

    render: function() {
        return React.createElement("form", {className: "new-player", onSubmit: this.onSubmit}, 
            React.createElement(Namelet, {name: this.state.text}), 
            React.createElement("input", {type: "name", 
                className: "name", 
                value: this.state.text, 
                placeholder: "Another Player", 
                autoCapitalize: "on", 
                onChange: this.onChange
                }), 
            React.createElement("button", {className: "new-player"}, 
                "Add")
        )
    },

    onChange: function(e) {
        var name = e.target.value
        name = name.charAt(0).toUpperCase() + name.slice(1),
        this.setState({text: name})
    },

    onSubmit: function(e) {
        e.preventDefault()
        if (this.state.text != "") {
            this.props.onAddName(this.state.text)
            this.setState({text: ""})
        }
    }
});

module.exports = NewName


},{"./namelet.jsx":10}],12:[function(require,module,exports){
/** @jsx React.DOM */

var Namelet = require('./namelet.jsx')
var PT = React.PropTypes

var PlayerChip = React.createClass({displayName: "PlayerChip",
    propTypes: {
        name: PT.string.isRequired,
    },

    render: function() {
        return React.createElement("div", {className: "player-chip"}, 
            React.createElement(Namelet, {name: this.props.name}), 
            React.createElement("span", {className: "name"}, this.props.name)
        )
    },
});

module.exports = PlayerChip


},{"./namelet.jsx":10}],13:[function(require,module,exports){
/** @jsx React.DOM */

var PT = React.PropTypes

var RoleCard = React.createClass({displayName: "RoleCard",
    propTypes: {
        playerName: PT.string.isRequired,
        role: PT.object.isRequired,
    },

    render: function() {
        var role = this.props.role
        var contents = null

        var theSpies = role.spies || role.otherSpies || [];
        var spiesText = theSpies.join(', ')
        var spyNoun = theSpies.length == 1 ? "spy" : "spies"
        var spyVerb = theSpies.length == 1 ? "is" : "are"
        var other = role.spy? "other" : ""
        var oberonText = role.hasOberon? React.createElement("span", null, React.createElement("br", null), React.createElement("span", {className: "spy"}, "Oberon"), " is hidden from you.") : ''
        var spiesBlock = theSpies.length > 0
                ? React.createElement("p", null, "The ", other, " ", spyNoun, " ", spyVerb, " ", React.createElement("span", {className: "spy"}, spiesText), ". ", oberonText)
                : React.createElement("p", null, "You do not see any ", other, " spies.")
        var extraInfo = React.createElement("div", null)
        var description = React.createElement("p", null)

        var name = React.createElement("span", {className: "resistance"}, "resistance")

        if (role.spy && !role.oberon) {
            name = React.createElement("span", null, "a ", React.createElement("span", {className: "spy"}, "spy"));
            extraInfo = spiesBlock;
        }
        if (role.percival) {
            name = React.createElement("span", {className: "resistance"}, "Percival")
            var theMerlins = role.merlins;
            var merlinsText = theMerlins.join(', ');
            var merlinNoun = theMerlins.length == 1 ? 'Merlin' : 'Merlins';
            var merlinVerb = theMerlins.length == 1 ? 'is' : 'are';
            var merlinsBlock = React.createElement("p", null, "The ", merlinNoun, " ", merlinVerb, ": ", merlinsText)
            extraInfo = merlinsBlock;
            description = React.createElement("p", null, "You see ", React.createElement("span", {className: "resistance"}, "Merlin"), " and ", React.createElement("span", {className: "spy"}, "Morgana"), " both as Merlin.")
        }
        if (role.merlin) {
            name = React.createElement("span", {className: "resistance"}, "Merlin");
            extraInfo = spiesBlock;
            description = React.createElement("p", null, "If the spies discover your identity, resistance loses!")
        }
        if (role.mordred) {
            name = React.createElement("span", {className: "spy"}, "Mordred")
            description = React.createElement("p", null, "You are invisible to ", React.createElement("span", {className: "resistance"}, "Merlin"), ".")
        }
        if (role.morgana) {
            name = React.createElement("span", {className: "spy"}, "Morgana")
            description = React.createElement("p", null, "You appear as ", React.createElement("span", {className: "resistance"}, "Merlin"), " to ", React.createElement("span", {className: "resistance"}, "Percival"), ".")
        }
        if (role.oberon) {
            name = React.createElement("span", {className: "spy"}, "Oberon")
            description = React.createElement("p", null, "The other spies cannot see you, and you cannot see them.")
        }

        return React.createElement("div", {className: "role-card"}, 
            React.createElement("p", null, "You are ", name, "!"), 
            extraInfo, 
            description
        )

    },

});

var If = React.createClass({displayName: "If",
    propTypes: {
        cond: PT.bool.isRequired,
        a: PT.element.isRequired,
        b: PT.element.isRequired,
    },

    render: function() {
        if (this.props.cond) {
            return this.props.a
        } else {
            return this.props.b
        }
    },
})

module.exports = RoleCard


},{}],14:[function(require,module,exports){
/** @jsx React.DOM */

var PlayerChip = require('./player-chip.jsx')
var PT = React.PropTypes

var RolePlayerEntry = React.createClass({displayName: "RolePlayerEntry",
    propTypes: {
        name: PT.string.isRequired,
        confirmed: PT.bool.isRequired,
        selected: PT.bool.isRequired,
        content: PT.element,

        onClickShow: PT.func.isRequired,
        onClickConfirm: PT.func.isRequired,
        onClickBack: PT.func.isRequired,
    },

    render: function() {
        return React.createElement("li", {key: this.props.name}, 
            React.createElement(PlayerChip, {name: this.props.name}), 
            this.renderButton(), 
            this.props.content
        )
    },

    renderButton: function() {

        var clickHandler = function() {
            this.props.onClickShow(this.props.name)
        }.bind(this);
        var text = "Show role";

        if(this.props.confirmed) {
            clickHandler = function() {
                this.props.onClickBack()
            }.bind(this);
            text = "Hide";
        }
        else if (this.props.selected) {
            clickHandler = function() {
                this.props.onClickConfirm(this.props.name)
            }.bind(this);
            text = "Are you " + this.props.name + "?";
        }

        return React.createElement("button", {onClick: clickHandler}, text)
    }

});

module.exports = RolePlayerEntry


},{"./player-chip.jsx":12}],15:[function(require,module,exports){
/** @jsx React.DOM */

var RolePlayerEntry = require('./role-player-entry.jsx')
var RoleCard = require('./role-card.jsx')
var PT = React.PropTypes

var RolesPage = React.createClass({displayName: "RolesPage",
    propTypes: {
        disabledReason: PT.oneOf(['tooFew', 'tooMany']),
        playerNames: PT.array.isRequired,
        selectedPlayer: PT.string,
        selectedRole: PT.object,
        selectionConfirmed: PT.bool.isRequired,
        onClickShow: PT.func.isRequired,
        onClickConfirm: PT.func.isRequired,
        onClickCancel: PT.func.isRequired,
        onClickOk: PT.func.isRequired,
    },

    render: function() {
        if (this.props.disabledReason !== null) {
            var message = {
                tooFew: "Not enough players. :(",
                tooMany: "Too many players. :(",
            }[this.props.disabledReason]
            return React.createElement("p", null, message)
        }

        var elements = this.props.playerNames.map(function(name) {
            return this.renderEntry(
                name,
                this.props.selectedPlayer === name,
                this.props.selectionConfirmed)
        }.bind(this))

        return React.createElement("ul", {className: "player-list"}, 
            elements
        )
    },

    renderEntry: function(name, selected, confirmed) {

        var content = null;
        if (selected && confirmed) {
            content = React.createElement(RoleCard, {
                playerName: this.props.selectedPlayer, 
                role: this.props.selectedRole})
        }

        return React.createElement(RolePlayerEntry, {
            key: name, 
            name: name, 
            content: content, 
            selected: selected, 
            confirmed: selected && confirmed, 

            onClickShow: this.props.onClickShow, 
            onClickConfirm: this.props.onClickConfirm, 
            onClickBack: this.props.onClickCancel})

    },
});

module.exports = RolesPage


},{"./role-card.jsx":13,"./role-player-entry.jsx":14}],16:[function(require,module,exports){
/** @jsx React.DOM */

var PT = React.PropTypes
var cx = classnames

var Settings = React.createClass({displayName: "Settings",
    propTypes: {
        // Mapping of settings to their values.
        settings: PT.object.isRequired,
        onChangeSettings: PT.func.isRequired,
    },

    render: function() {
        var settingOrder = ['morgana', 'mordred', 'oberon', 'merlin', 'percival']
        var items = settingOrder.map(function(setting) {
            return React.createElement("li", {key: setting}, React.createElement(Toggle, {
                setting: setting, 
                value: this.props.settings[setting], 
                onChange: this.onChangeSetting}))
        }.bind(this))
        return React.createElement("div", {className: "settings"}, 
            React.createElement("h2", null, "Special Roles"), 
            React.createElement("ul", null, items)
        )
    },

    onChangeSetting: function(setting) {
        var changes = {}
        changes[setting] = !this.props.settings[setting]
        this.props.onChangeSettings(changes)
    },
});

var Toggle = React.createClass({displayName: "Toggle",
    propTypes: {
        setting: PT.string.isRequired,
        value: PT.bool.isRequired,
        onChange: PT.func.isRequired,
    },

    render: function() {
        return React.createElement("button", {
            className: cx({
                'toggle': true,
                'active': this.props.value,
            }), 
            onClick: this.onClick}, 
            capitalize(this.props.setting)
        )
    },

    onClick: function() {
        this.props.onChange(this.props.setting)
    },
});

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = Settings


},{}],17:[function(require,module,exports){
/** @jsx React.DOM */

var SetupPlayerList = require('./setup-player-list.jsx')
var Settings = require('./settings.jsx')
var PT = React.PropTypes

var SetupPage = React.createClass({displayName: "SetupPage",
    propTypes: {
        playerNames: PT.array.isRequired,
        // Mapping of settings to their values.
        settings: PT.object.isRequired,
        onAddName: PT.func.isRequired,
        onDeleteName: PT.func.isRequired,
        onChangeSettings: PT.func.isRequired,
        onNewRoles: PT.func.isRequired,
    },

    render: function() {
        return React.createElement("div", null, 
            React.createElement(SetupPlayerList, {
                playerNames: this.props.playerNames, 
                onAddName: this.props.onAddName, 
                onDeleteName: this.props.onDeleteName}), 
            React.createElement(Settings, {
                settings: this.props.settings, 
                onChangeSettings: this.props.onChangeSettings}), 
            React.createElement("button", {className: "new-game", 
                onClick: this.props.onNewRoles}, "New Game")
        )
    },
});

module.exports = SetupPage


},{"./settings.jsx":16,"./setup-player-list.jsx":18}],18:[function(require,module,exports){
/** @jsx React.DOM */

var NewName = require('./new-name.jsx')
var PlayerChip = require('./player-chip.jsx')
var PT = React.PropTypes

var SetupPlayerList = React.createClass({displayName: "SetupPlayerList",
    propTypes: {
        playerNames: PT.array.isRequired,
        onDeleteName: PT.func.isRequired,
        onAddName: PT.func.isRequired,
    },

    render: function() {
        var elements = this.props.playerNames.map(
            this.renderEntry)

        return React.createElement("div", null, React.createElement("h2", null, "Players"), 
            React.createElement("ul", {className: "player-list"}, 
                elements, 
                React.createElement("li", null, 
                    React.createElement(NewName, {onAddName: this.props.onAddName})
                )
            )
        )
    },

    renderEntry: function(name) {
        var onClick = function() {
            this.props.onDeleteName(name);
        }.bind(this);

        return React.createElement("li", {key: name}, 
            React.createElement(PlayerChip, {name: name}), 
            React.createElement("button", {className: "delete", 
                onClick: onClick}
            )
        )
    },
});

module.exports = SetupPlayerList


},{"./new-name.jsx":11,"./player-chip.jsx":12}],19:[function(require,module,exports){
"use strict";
module.exports = store_reset;
function store_reset(version) {
  var stored = store.get('STORE_DB_VERSION');
  if (stored === version) {
    return;
  } else {
    store.clear();
    store.set('STORE_DB_VERSION', version);
  }
}


//# sourceURL=/home/miles/code/reactance/scripts/store-reset.js
},{}],20:[function(require,module,exports){
"use strict";
var BackboneEvents = require("backbone-events-standalone");
module.exports = Store;
function Store() {
  this._eventer = BackboneEvents.mixin({});
  this._emitChangeBatcher = null;
}
Store.prototype.onChange = function(callback) {
  this._eventer.on('change', callback);
};
Store.prototype.offChange = function(callback) {
  this._eventer.off('change', callback);
};
Store.prototype.emitChange = function() {
  if (this._emitChangeBatcher === null) {
    this._emitChangeBatcher = setTimeout(function() {
      this._eventer.trigger('change');
      this._emitChangeBatcher = null;
    }.bind(this), 10);
  }
};
Store.mixin = function(obj) {
  var store = new Store();
  obj.onChange = store.onChange.bind(store);
  obj.offChange = store.offChange.bind(store);
  obj.emitChange = store.emitChange.bind(store);
};


//# sourceURL=/home/miles/code/reactance/scripts/store.js
},{"backbone-events-standalone":2}],21:[function(require,module,exports){
/** @jsx React.DOM */

var PT = React.PropTypes
var cx = classnames

var Tabs = React.createClass({displayName: "Tabs",
    propTypes: {
        activeTab: PT.string.isRequired,
        onChangeTab: PT.func.isRequired,
        tabs: PT.object.isRequired,
    },

    render: function() {
        return React.createElement("div", null, 
            React.createElement("nav", null, 
            this.renderButtons()
            ), 
            React.createElement("div", {className: "tab-contents"}, 
            this.props.tabs[this.props.activeTab].content
            )
        )
    },

    renderButtons: function() {
        return _.map(this.props.tabs, function(val, name) {
            var changeTab = function(e) {
                this.props.onChangeTab(name)
            }.bind(this)

            return React.createElement("a", {
                className: cx({
                    'active': this.props.activeTab === name,
                }), 
                key: name, 
                "data-name": name, 
                onClick: changeTab, 
                onTouchStart: changeTab}, 
                val.name)
        }.bind(this)) 
    },
});

module.exports = Tabs


},{}],22:[function(require,module,exports){
"use strict";
var Store = require('./store');
module.exports = UIState;
function UIState(dispatcher) {
  Store.mixin(this);
  this.tab = 'setup';
  this.selectedPlayer = null;
  this.selectionConfirmed = false;
  this.missionRevealed = false;
  dispatcher.onAction(function(payload) {
    var actions = UIState.actions;
    if (_.isFunction(actions[payload.action])) {
      actions[payload.action].call(this, payload);
      this.save();
    }
  }.bind(this));
}
var PERSIST_KEYS = ['tab', 'selectedPlayer', 'selectionConfirmed', 'missionRevealed'];
UIState.prototype.save = function() {
  var $__0 = this;
  var persist = {};
  PERSIST_KEYS.forEach((function(key) {
    return persist[key] = $__0[key];
  }));
  store.set('store.uistate', persist);
};
UIState.prototype.load = function() {
  var $__0 = this;
  var persist = store.get('store.uistate');
  if (persist !== undefined) {
    PERSIST_KEYS.forEach((function(key) {
      return $__0[key] = persist[key];
    }));
  }
};
UIState.actions = {};
UIState.actions.changeTab = function($__1) {
  var tab = $__1.tab;
  this.tab = tab;
  this.selectedPlayer = null;
  this.selectionConfirmed = false;
  this.emitChange();
};
UIState.actions.selectPlayer = function($__1) {
  var name = $__1.name;
  this.selectedPlayer = name;
  this.selectionConfirmed = false;
  this.emitChange();
};
UIState.actions.confirmPlayer = function($__1) {
  var name = $__1.name;
  this.selectedPlayer = name;
  this.selectionConfirmed = true;
  this.emitChange();
};
UIState.actions.deselectPlayer = function() {
  this.selectedPlayer = null;
  this.selectionConfirmed = false;
  this.emitChange();
};
UIState.actions.missionReveal = function() {
  this.missionRevealed = true;
  this.emitChange();
};
UIState.actions.missionReset = function() {
  this.missionRevealed = false;
  this.emitChange();
};
UIState.actions.newRoles = function() {
  this.tab = 'roles';
  this.selectedPlayer = null;
  this.selectionConfirmed = false;
  this.emitChange();
};


//# sourceURL=/home/miles/code/reactance/scripts/ui-state.js
},{"./store":20}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL21pbGVzL2NvZGUvcmVhY3RhbmNlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUuanMiLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvaW5kZXguanMiLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9zY3JpcHRzL2NvbG9yLmpzIiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy9kaXNwYXRjaGVyLmpzIiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy9nYW1lLXN0YXRlLmpzIiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL21pbGVzL2NvZGUvcmVhY3RhbmNlL3NjcmlwdHMvbGFiZWxlZC1udW1iZXIuanN4IiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy9taXNzaW9uLXBhZ2UuanN4IiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy9taXNzaW9uLXN0YXRlLmpzIiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy9uYW1lbGV0LmpzeCIsIi9ob21lL21pbGVzL2NvZGUvcmVhY3RhbmNlL3NjcmlwdHMvbmV3LW5hbWUuanN4IiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy9wbGF5ZXItY2hpcC5qc3giLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9zY3JpcHRzL3JvbGUtY2FyZC5qc3giLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9zY3JpcHRzL3JvbGUtcGxheWVyLWVudHJ5LmpzeCIsIi9ob21lL21pbGVzL2NvZGUvcmVhY3RhbmNlL3NjcmlwdHMvcm9sZXMtcGFnZS5qc3giLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9zY3JpcHRzL3NldHRpbmdzLmpzeCIsIi9ob21lL21pbGVzL2NvZGUvcmVhY3RhbmNlL3NjcmlwdHMvc2V0dXAtcGFnZS5qc3giLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9zY3JpcHRzL3NldHVwLXBsYXllci1saXN0LmpzeCIsIi9ob21lL21pbGVzL2NvZGUvcmVhY3RhbmNlL3NjcmlwdHMvc3RvcmUtcmVzZXQuanMiLCIvaG9tZS9taWxlcy9jb2RlL3JlYWN0YW5jZS9zY3JpcHRzL3N0b3JlLmpzIiwiL2hvbWUvbWlsZXMvY29kZS9yZWFjdGFuY2Uvc2NyaXB0cy90YWJzLmpzeCIsIi9ob21lL21pbGVzL2NvZGUvcmVhY3RhbmNlL3NjcmlwdHMvdWktc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFtQixFQUFJLE1BQUksQ0FBQTtBQUM5QixLQUFHLFdBQVcsQUFBQyxFQUFDLENBQUE7QUFDcEIsQ0FBQTtBQUVpcEwiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBTdGFuZGFsb25lIGV4dHJhY3Rpb24gb2YgQmFja2JvbmUuRXZlbnRzLCBubyBleHRlcm5hbCBkZXBlbmRlbmN5IHJlcXVpcmVkLlxuICogRGVncmFkZXMgbmljZWx5IHdoZW4gQmFja29uZS91bmRlcnNjb3JlIGFyZSBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudFxuICogZ2xvYmFsIGNvbnRleHQuXG4gKlxuICogTm90ZSB0aGF0IGRvY3Mgc3VnZ2VzdCB0byB1c2UgdW5kZXJzY29yZSdzIGBfLmV4dGVuZCgpYCBtZXRob2QgdG8gYWRkIEV2ZW50c1xuICogc3VwcG9ydCB0byBzb21lIGdpdmVuIG9iamVjdC4gQSBgbWl4aW4oKWAgbWV0aG9kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBFdmVudHNcbiAqIHByb3RvdHlwZSB0byBhdm9pZCB1c2luZyB1bmRlcnNjb3JlIGZvciB0aGF0IHNvbGUgcHVycG9zZTpcbiAqXG4gKiAgICAgdmFyIG15RXZlbnRFbWl0dGVyID0gQmFja2JvbmVFdmVudHMubWl4aW4oe30pO1xuICpcbiAqIE9yIGZvciBhIGZ1bmN0aW9uIGNvbnN0cnVjdG9yOlxuICpcbiAqICAgICBmdW5jdGlvbiBNeUNvbnN0cnVjdG9yKCl7fVxuICogICAgIE15Q29uc3RydWN0b3IucHJvdG90eXBlLmZvbyA9IGZ1bmN0aW9uKCl7fVxuICogICAgIEJhY2tib25lRXZlbnRzLm1peGluKE15Q29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAqXG4gKiAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBJbmMuXG4gKiAoYykgMjAxMyBOaWNvbGFzIFBlcnJpYXVsdFxuICovXG4vKiBnbG9iYWwgZXhwb3J0czp0cnVlLCBkZWZpbmUsIG1vZHVsZSAqL1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdCA9IHRoaXMsXG4gICAgICBuYXRpdmVGb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcbiAgICAgIGlkQ291bnRlciA9IDA7XG5cbiAgLy8gUmV0dXJucyBhIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gbWF0Y2hpbmcgdGhlIG1pbmltYWwgQVBJIHN1YnNldCByZXF1aXJlZFxuICAvLyBieSBCYWNrYm9uZS5FdmVudHNcbiAgZnVuY3Rpb24gbWluaXNjb3JlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBrZXlzOiBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmogIT09IFwiZnVuY3Rpb25cIiB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5cygpIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSwga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGtleXNba2V5cy5sZW5ndGhdID0ga2V5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgIH0sXG5cbiAgICAgIHVuaXF1ZUlkOiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICAgICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgICAgIH0sXG5cbiAgICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbmNlOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICBmdW5jID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdmFyIF8gPSBtaW5pc2NvcmUoKSwgRXZlbnRzO1xuXG4gIC8vIEJhY2tib25lLkV2ZW50c1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBIG1vZHVsZSB0aGF0IGNhbiBiZSBtaXhlZCBpbiB0byAqYW55IG9iamVjdCogaW4gb3JkZXIgdG8gcHJvdmlkZSBpdCB3aXRoXG4gIC8vIGN1c3RvbSBldmVudHMuIFlvdSBtYXkgYmluZCB3aXRoIGBvbmAgb3IgcmVtb3ZlIHdpdGggYG9mZmAgY2FsbGJhY2tcbiAgLy8gZnVuY3Rpb25zIHRvIGFuIGV2ZW50OyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICBFdmVudHMgPSB7XG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi4gUGFzc2luZyBgXCJhbGxcImAgd2lsbCBiaW5kXG4gICAgLy8gdGhlIGNhbGxiYWNrIHRvIGFsbCBldmVudHMgZmlyZWQuXG4gICAgb246IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb24nLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8ICh0aGlzLl9ldmVudHNbbmFtZV0gPSBbXSk7XG4gICAgICBldmVudHMucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBjb250ZXh0OiBjb250ZXh0LCBjdHg6IGNvbnRleHQgfHwgdGhpc30pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gb25seSBiZSB0cmlnZ2VyZWQgYSBzaW5nbGUgdGltZS4gQWZ0ZXIgdGhlIGZpcnN0IHRpbWVcbiAgICAvLyB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgaXQgd2lsbCBiZSByZW1vdmVkLlxuICAgIG9uY2U6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb25jZScsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgb25jZSA9IF8ub25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5vZmYobmFtZSwgb25jZSk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIG9uY2UuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICByZXR1cm4gdGhpcy5vbihuYW1lLCBvbmNlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIG9uZSBvciBtYW55IGNhbGxiYWNrcy4gSWYgYGNvbnRleHRgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgdGhlIGV2ZW50LiBJZiBgbmFtZWAgaXMgbnVsbCwgcmVtb3ZlcyBhbGwgYm91bmRcbiAgICAvLyBjYWxsYmFja3MgZm9yIGFsbCBldmVudHMuXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgdmFyIHJldGFpbiwgZXYsIGV2ZW50cywgbmFtZXMsIGksIGwsIGosIGs7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhZXZlbnRzQXBpKHRoaXMsICdvZmYnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIW5hbWUgJiYgIWNhbGxiYWNrICYmICFjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHJldGFpbiA9IFtdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBjb250ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZXZlbnRzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICBldiA9IGV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgaWYgKChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrLl9jYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGV2LmNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0YWluLnB1c2goZXYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmV0YWluLmxlbmd0aCkgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gICAgLy8gcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcbiAgICAvLyAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG9cbiAgICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAndHJpZ2dlcicsIG5hbWUsIGFyZ3MpKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gdGhpcy5fZXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRlbGwgdGhpcyBvYmplY3QgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gZWl0aGVyIHNwZWNpZmljIGV2ZW50cyAuLi4gb3JcbiAgICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZGVsZXRlTGlzdGVuZXIgPSAhbmFtZSAmJiAhY2FsbGJhY2s7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBpZiAob2JqKSAobGlzdGVuZXJzID0ge30pW29iai5fbGlzdGVuZXJJZF0gPSBvYmo7XG4gICAgICBmb3IgKHZhciBpZCBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzW2lkXS5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgICBpZiAoZGVsZXRlTGlzdGVuZXIpIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbaWRdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gIH07XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5ncy5cbiAgdmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbiAgLy8gSW1wbGVtZW50IGZhbmN5IGZlYXR1cmVzIG9mIHRoZSBFdmVudHMgQVBJIHN1Y2ggYXMgbXVsdGlwbGUgZXZlbnRcbiAgLy8gbmFtZXMgYFwiY2hhbmdlIGJsdXJcImAgYW5kIGpRdWVyeS1zdHlsZSBldmVudCBtYXBzIGB7Y2hhbmdlOiBhY3Rpb259YFxuICAvLyBpbiB0ZXJtcyBvZiB0aGUgZXhpc3RpbmcgQVBJLlxuICB2YXIgZXZlbnRzQXBpID0gZnVuY3Rpb24ob2JqLCBhY3Rpb24sIG5hbWUsIHJlc3QpIHtcbiAgICBpZiAoIW5hbWUpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gSGFuZGxlIGV2ZW50IG1hcHMuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG5hbWUpIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBba2V5LCBuYW1lW2tleV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNwYWNlIHNlcGFyYXRlZCBldmVudCBuYW1lcy5cbiAgICBpZiAoZXZlbnRTcGxpdHRlci50ZXN0KG5hbWUpKSB7XG4gICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGV2ZW50U3BsaXR0ZXIpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBbbmFtZXNbaV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gQSBkaWZmaWN1bHQtdG8tYmVsaWV2ZSwgYnV0IG9wdGltaXplZCBpbnRlcm5hbCBkaXNwYXRjaCBmdW5jdGlvbiBmb3JcbiAgLy8gdHJpZ2dlcmluZyBldmVudHMuIFRyaWVzIHRvIGtlZXAgdGhlIHVzdWFsIGNhc2VzIHNwZWVkeSAobW9zdCBpbnRlcm5hbFxuICAvLyBCYWNrYm9uZSBldmVudHMgaGF2ZSAzIGFyZ3VtZW50cykuXG4gIHZhciB0cmlnZ2VyRXZlbnRzID0gZnVuY3Rpb24oZXZlbnRzLCBhcmdzKSB7XG4gICAgdmFyIGV2LCBpID0gLTEsIGwgPSBldmVudHMubGVuZ3RoLCBhMSA9IGFyZ3NbMF0sIGEyID0gYXJnc1sxXSwgYTMgPSBhcmdzWzJdO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgpOyByZXR1cm47XG4gICAgICBjYXNlIDE6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSk7IHJldHVybjtcbiAgICAgIGNhc2UgMjogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMik7IHJldHVybjtcbiAgICAgIGNhc2UgMzogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMiwgYTMpOyByZXR1cm47XG4gICAgICBkZWZhdWx0OiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5hcHBseShldi5jdHgsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuTWV0aG9kcyA9IHtsaXN0ZW5UbzogJ29uJywgbGlzdGVuVG9PbmNlOiAnb25jZSd9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAgYW5kIGBvbmNlYC4gVGVsbCAqdGhpcyogb2JqZWN0IHRvXG4gIC8vIGxpc3RlbiB0byBhbiBldmVudCBpbiBhbm90aGVyIG9iamVjdCAuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3NcbiAgLy8gbGlzdGVuaW5nIHRvLlxuICBfLmVhY2gobGlzdGVuTWV0aG9kcywgZnVuY3Rpb24oaW1wbGVtZW50YXRpb24sIG1ldGhvZCkge1xuICAgIEV2ZW50c1ttZXRob2RdID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCAodGhpcy5fbGlzdGVuZXJzID0ge30pO1xuICAgICAgdmFyIGlkID0gb2JqLl9saXN0ZW5lcklkIHx8IChvYmouX2xpc3RlbmVySWQgPSBfLnVuaXF1ZUlkKCdsJykpO1xuICAgICAgbGlzdGVuZXJzW2lkXSA9IG9iajtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIG9ialtpbXBsZW1lbnRhdGlvbl0obmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIE1peGluIHV0aWxpdHlcbiAgRXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgICB2YXIgZXhwb3J0cyA9IFsnb24nLCAnb25jZScsICdvZmYnLCAndHJpZ2dlcicsICdzdG9wTGlzdGVuaW5nJywgJ2xpc3RlblRvJyxcbiAgICAgICAgICAgICAgICAgICAnbGlzdGVuVG9PbmNlJywgJ2JpbmQnLCAndW5iaW5kJ107XG4gICAgXy5lYWNoKGV4cG9ydHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gcHJvdG87XG4gIH07XG5cbiAgLy8gRXhwb3J0IEV2ZW50cyBhcyBCYWNrYm9uZUV2ZW50cyBkZXBlbmRpbmcgb24gY3VycmVudCBjb250ZXh0XG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50cztcbiAgICB9XG4gICAgZXhwb3J0cy5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfWVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudHM7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfVxufSkodGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gY29sb3JTdHlsZUZvclBsYXllcjtcblxuZnVuY3Rpb24gY29sb3JTdHlsZUZvclBsYXllcihwbGF5ZXIpIHtcbiAgICAvLyBLZWVwIHRoaXMgaW4gc3luYyB3aXRoIGluZGV4Lmxlc3NcbiAgICB2YXIgbnVtQ29sb3JzID0gMTBcbiAgICB2YXIgb2Zmc2V0ID0gOFxuICAgIHZhciBtdWx0ID0gM1xuICAgIHZhciBjb2xvck51bSA9IE1hdGguYWJzKGhhc2hTdHJpbmcocGxheWVyKSAqIG11bHQgKyBvZmZzZXQpICUgKG51bUNvbG9ycykgKyAxXG4gICAgcmV0dXJuIGBuYW1lbGV0LSR7Y29sb3JOdW19YFxufVxuXG5mdW5jdGlvbiBnZXRDb2xvckZyb21TdHJpbmcocGxheWVyKSB7XG4gICAgLy8gY29sb3JzIGZyb20gaHR0cDovL2ZsYXR1aWNvbG9ycy5jb20vXG4gICAgdmFyIGNvbG9ycyA9IFtcIiNjMDM5MmJcIiwgXCIjMjdhZTYwXCIsIFwiIzM0OThkYlwiLCBcIiM5YjU5YjZcIiwgXCIjZjFjNDBmXCIsIFwiI2U2N2UyMlwiLCBcIiNlNzRjM2NcIl07XG5cbiAgICByZXR1cm4gY29sb3JzW2hhc2hTdHJpbmcocGxheWVyKSAlIGNvbG9ycy5sZW5ndGhdO1xuXG59XG5cbmZ1bmN0aW9uIGhhc2hTdHJpbmcoc3RyKSB7XG4gICAgdmFyIGhhc2ggPSAwLCBpLCBjaHIsIGxlbjtcbiAgICBpZiAoc3RyLmxlbmd0aCA9PSAwKSByZXR1cm4gaGFzaDtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdHIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY2hyICAgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaGFzaCAgPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGNocjtcbiAgICAgICAgaGFzaCB8PSAwO1xuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbn1cblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pTDJodmJXVXZiV2xzWlhNdlkyOWtaUzl5WldGamRHRnVZMlV2YzJOeWFYQjBjeTlqYjJ4dmNpNXFjeUlzSW5OdmRYSmpaWE1pT2xzaUwyaHZiV1V2Yldsc1pYTXZZMjlrWlM5eVpXRmpkR0Z1WTJVdmMyTnlhWEIwY3k5amIyeHZjaTVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTeE5RVUZOTEVOQlFVTXNUMEZCVHl4SFFVRkhMRzFDUVVGdFFpeERRVUZET3p0QlFVVnlReXhUUVVGVExHMUNRVUZ0UWl4RFFVRkRMRTFCUVUwc1JVRkJSVHM3U1VGRmFrTXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSVHRKUVVOc1FpeEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRPMGxCUTJRc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF6dEpRVU5hTEVsQlFVa3NVVUZCVVN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlZTeERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhOUVVGTkxFTkJRVU1zU1VGQlNTeFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRPMGxCUXpkRkxFOUJRVThzVjBGQlZ5eFJRVUZSTEVWQlFVVTdRVUZEYUVNc1EwRkJRenM3UVVGRlJDeFRRVUZUTEd0Q1FVRnJRaXhEUVVGRExFMUJRVTBzUlVGQlJUczdRVUZGY0VNc1NVRkJTU3hKUVVGSkxFMUJRVTBzUjBGQlJ5eERRVUZETEZOQlFWTXNSVUZCUlN4VFFVRlRMRVZCUVVVc1UwRkJVeXhGUVVGRkxGTkJRVk1zUlVGQlJTeFRRVUZUTEVWQlFVVXNVMEZCVXl4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE96dEJRVVV2Uml4SlFVRkpMRTlCUVU4c1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03TzBGQlJYUkVMRU5CUVVNN08wRkJSVVFzVTBGQlV5eFZRVUZWTEVOQlFVTXNSMEZCUnl4RlFVRkZPMGxCUTNKQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUTBGQlF6dEpRVU14UWl4SlFVRkpMRWRCUVVjc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eEZRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJwRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1IwRkJSeXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NSMEZCUnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8xRkJRM2hETEVkQlFVY3NTMEZCU3l4SFFVRkhMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6RkNMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNTVUZCU1N4SlFVRkpMRWxCUVVrc1IwRkJSeXhEUVVGRE8xRkJRMjVETEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNN1MwRkRZanRKUVVORUxFOUJRVThzU1VGQlNTeERRVUZETzBOQlEyWWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUp0YjJSMWJHVXVaWGh3YjNKMGN5QTlJR052Ykc5eVUzUjViR1ZHYjNKUWJHRjVaWEk3WEc1Y2JtWjFibU4wYVc5dUlHTnZiRzl5VTNSNWJHVkdiM0pRYkdGNVpYSW9jR3hoZVdWeUtTQjdYRzRnSUNBZ0x5OGdTMlZsY0NCMGFHbHpJR2x1SUhONWJtTWdkMmwwYUNCcGJtUmxlQzVzWlhOelhHNGdJQ0FnZG1GeUlHNTFiVU52Ykc5eWN5QTlJREV3WEc0Z0lDQWdkbUZ5SUc5bVpuTmxkQ0E5SURoY2JpQWdJQ0IyWVhJZ2JYVnNkQ0E5SUROY2JpQWdJQ0IyWVhJZ1kyOXNiM0pPZFcwZ1BTQk5ZWFJvTG1GaWN5aG9ZWE5vVTNSeWFXNW5LSEJzWVhsbGNpa2dLaUJ0ZFd4MElDc2diMlptYzJWMEtTQWxJQ2h1ZFcxRGIyeHZjbk1wSUNzZ01WeHVJQ0FnSUhKbGRIVnliaUJnYm1GdFpXeGxkQzBrZTJOdmJHOXlUblZ0ZldCY2JuMWNibHh1Wm5WdVkzUnBiMjRnWjJWMFEyOXNiM0pHY205dFUzUnlhVzVuS0hCc1lYbGxjaWtnZTF4dUlDQWdJQzh2SUdOdmJHOXljeUJtY205dElHaDBkSEE2THk5bWJHRjBkV2xqYjJ4dmNuTXVZMjl0TDF4dUlDQWdJSFpoY2lCamIyeHZjbk1nUFNCYlhDSWpZekF6T1RKaVhDSXNJRndpSXpJM1lXVTJNRndpTENCY0lpTXpORGs0WkdKY0lpd2dYQ0lqT1dJMU9XSTJYQ0lzSUZ3aUkyWXhZelF3Wmx3aUxDQmNJaU5sTmpkbE1qSmNJaXdnWENJalpUYzBZek5qWENKZE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUdOdmJHOXljMXRvWVhOb1UzUnlhVzVuS0hCc1lYbGxjaWtnSlNCamIyeHZjbk11YkdWdVozUm9YVHRjYmx4dWZWeHVYRzVtZFc1amRHbHZiaUJvWVhOb1UzUnlhVzVuS0hOMGNpa2dlMXh1SUNBZ0lIWmhjaUJvWVhOb0lEMGdNQ3dnYVN3Z1kyaHlMQ0JzWlc0N1hHNGdJQ0FnYVdZZ0tITjBjaTVzWlc1bmRHZ2dQVDBnTUNrZ2NtVjBkWEp1SUdoaGMyZzdYRzRnSUNBZ1ptOXlJQ2hwSUQwZ01Dd2diR1Z1SUQwZ2MzUnlMbXhsYm1kMGFEc2dhU0E4SUd4bGJqc2dhU3NyS1NCN1hHNGdJQ0FnSUNBZ0lHTm9jaUFnSUQwZ2MzUnlMbU5vWVhKRGIyUmxRWFFvYVNrN1hHNGdJQ0FnSUNBZ0lHaGhjMmdnSUQwZ0tDaG9ZWE5vSUR3OElEVXBJQzBnYUdGemFDa2dLeUJqYUhJN1hHNGdJQ0FnSUNBZ0lHaGhjMmdnZkQwZ01EdGNiaUFnSUNCOVhHNGdJQ0FnY21WMGRYSnVJR2hoYzJnN1hHNTlYRzRpWFgwPSIsIi8qKlxuICogRmx1eCBEaXNwYXRjaGVyXG4gKlxuICogRGlzcGF0Y2hlcyBhY3Rpb25zIHRvIGxpc3RlbmVycyByZWdpc3RlcmVkIHVzaW5nIG9uQWN0aW9uLlxuICogQWN0aW9ucyBhcmUgZGVsaXZlcmQgYXMgcGF5bG9hZHMgbGlrZVxuICogICB7YWN0aW9uOiAnY2hhbmdlU2V0dGluZ3MnLCBjb2xvcjogY29sb3J9XG4gKiBUaGUgJ2FjdGlvbicga2V5IGlzIHJlcXVpcmVkLCBhbGwgb3RoZXIga2V5cyBhcmUgdXAgdG8gdGhlIGFwcGxpY2F0aW9uLlxuICovXG52YXIgQmFja2JvbmVFdmVudHMgPSByZXF1aXJlKFwiYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gRGlzcGF0Y2hlclxuXG5mdW5jdGlvbiBEaXNwYXRjaGVyKCkge1xuICAgIHRoaXMuX2V2ZW50ZXIgPSBCYWNrYm9uZUV2ZW50cy5taXhpbih7fSlcbn1cblxuLyoqXG4gKiBEaXNwYXRjaCBhbiBhY3Rpb24uXG4gKiBVc2FnZTpcbiAqIGRpc3BhdGNoZXIoJ2ZpZGdldCcpXG4gKiBkaXNwYXRjaGVyKCdmaWRnZXQnLCB7d2l0aDogJ3BlbmNpbCd9KVxuICogZGlzcGF0Y2hlcih7YWN0aW9uOiAnZmlkZ2V0Jywgd2l0aDogJ3BlbmNpbCd9KVxuICovXG5EaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uKGFjdGlvbiwgcGF5bG9hZCkge1xuICAgIGlmIChfLmlzU3RyaW5nKGFjdGlvbikpIHtcbiAgICAgICAgcGF5bG9hZCA9IF8uZXh0ZW5kKHthY3Rpb246IGFjdGlvbn0sIHBheWxvYWQpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGF5bG9hZCA9IGFjdGlvblxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgZGlzcGF0Y2g6ICR7cGF5bG9hZC5hY3Rpb259YClcbiAgICB0aGlzLl9ldmVudGVyLnRyaWdnZXIoJ2FjdGlvbicsIHBheWxvYWQpXG59XG5cbi8qKlxuICogU2hvcnRoYW5kIHRvIHByZXBhcmUgYSBzaW1wbGUgZGlzcGF0Y2ggZnVuY3Rpb24uXG4gKiBEb2VzIG5vdCBmaXJlIGFuIGV2ZW50LCBidXQgcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgY2FuLlxuICogVGhlc2UgYXJlIGVxdWl2YWxlbnQ6XG4gKiBkaXNwYXRjaGVyLmJha2UoJ2NoYW5nZVNldHRpbmcnLCAnY29sb3InKVxuICogKGNvbG9yKSA9PiB7IGRpc3BhdGNoZXIuZGlzcGF0Y2goJ2NoYW5nZVNldHRpbmcnLCB7Y29sb3I6IGNvbG9yfSkgfVxuICovXG5EaXNwYXRjaGVyLnByb3RvdHlwZS5iYWtlID0gZnVuY3Rpb24oYWN0aW9uLCBmaWVsZCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgcGF5bG9hZCA9IHthY3Rpb246IGFjdGlvbn1cbiAgICAgICAgaWYgKGZpZWxkICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcGF5bG9hZFtmaWVsZF0gPSBpbnB1dFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlzcGF0Y2gocGF5bG9hZClcbiAgICB9LmJpbmQodGhpcylcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIHJlY2VpdmUgYWxsIGFjdGlvbnMuXG4gKiBFeGFtcGxlOlxuICogZGlzcGF0Y2hlci5vbkFjdGlvbigoYWN0aW9uKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKGBnb3QgYWN0aW9uIG9mIHR5cGUgJHtwYXlsb2FkLmFjdGlvbn1gXG4gKiB9KVxuICovXG5EaXNwYXRjaGVyLnByb3RvdHlwZS5vbkFjdGlvbiA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fZXZlbnRlci5vbignYWN0aW9uJywgY2FsbGJhY2spXG59XG5cbi8qKlxuICogVW5yZWdpc3RlciBhIGNhbGxiYWNrIHByZXZpb3VzbHkgcmVnaXN0ZXJlZCB3aXRoIG9uQWN0aW9uLlxuICovXG5EaXNwYXRjaGVyLnByb3RvdHlwZS5vZmZBY3Rpb24gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHRoaXMuX2V2ZW50ZXIub2ZmKCdhY3Rpb24nLCBjYWxsYmFjaylcbn1cblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pTDJodmJXVXZiV2xzWlhNdlkyOWtaUzl5WldGamRHRnVZMlV2YzJOeWFYQjBjeTlrYVhOd1lYUmphR1Z5TG1weklpd2ljMjkxY21ObGN5STZXeUl2YUc5dFpTOXRhV3hsY3k5amIyUmxMM0psWVdOMFlXNWpaUzl6WTNKcGNIUnpMMlJwYzNCaGRHTm9aWEl1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWtGQlFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEhRVVZITzBGQlEwZ3NTVUZCU1N4alFVRmpMRWRCUVVjc1QwRkJUeXhEUVVGRExEUkNRVUUwUWl4RFFVRkRMRU5CUVVNN08wRkJSVE5FTEUxQlFVMHNRMEZCUXl4UFFVRlBMRWRCUVVjc1ZVRkJWVHM3UVVGRk0wSXNVMEZCVXl4VlFVRlZMRWRCUVVjN1NVRkRiRUlzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUnl4alFVRmpMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF6dEJRVU0xUXl4RFFVRkRPenRCUVVWRU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMGRCUlVjN1FVRkRTQ3hWUVVGVkxFTkJRVU1zVTBGQlV5eERRVUZETEZGQlFWRXNSMEZCUnl4VFFVRlRMRTFCUVUwc1JVRkJSU3hQUVVGUExFVkJRVVU3U1VGRGRFUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTzFGQlEzQkNMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF6dExRVU5vUkN4TlFVRk5PMUZCUTBnc1QwRkJUeXhIUVVGSExFMUJRVTA3UzBGRGJrSTdTVUZEUkN4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExHRkJRV0VzVDBGQlR5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRPMGxCUXpGRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRkZCUVZFc1JVRkJSU3hQUVVGUExFTkJRVU03UVVGRE5VTXNRMEZCUXpzN1FVRkZSRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0SFFVVkhPMEZCUTBnc1ZVRkJWU3hEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVkQlFVY3NVMEZCVXl4TlFVRk5MRVZCUVVVc1MwRkJTeXhGUVVGRk8wbEJRMmhFTEU5QlFVOHNVMEZCVXl4TFFVRkxMRVZCUVVVN1VVRkRia0lzU1VGQlNTeFBRVUZQTEVkQlFVY3NRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hEUVVGRE8xRkJRemxDTEVsQlFVa3NTMEZCU3l4SlFVRkpMRk5CUVZNc1JVRkJSVHRaUVVOd1FpeFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1MwRkJTenRUUVVONlFqdFJRVU5FTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRE8wdEJRM3BDTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRCUVVOb1FpeERRVUZET3p0QlFVVkVPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBkQlJVYzdRVUZEU0N4VlFVRlZMRU5CUVVNc1UwRkJVeXhEUVVGRExGRkJRVkVzUjBGQlJ5eFRRVUZUTEZGQlFWRXNSVUZCUlR0SlFVTXZReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFVVXNRMEZCUXl4UlFVRlJMRVZCUVVVc1VVRkJVU3hEUVVGRE8wRkJRM2hETEVOQlFVTTdPMEZCUlVRN08wZEJSVWM3UVVGRFNDeFZRVUZWTEVOQlFVTXNVMEZCVXl4RFFVRkRMRk5CUVZNc1IwRkJSeXhUUVVGVExGRkJRVkVzUlVGQlJUdEpRVU5vUkN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eFJRVUZSTEVWQlFVVXNVVUZCVVN4RFFVRkRPME5CUTNoRElpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lMeW9xWEc0Z0tpQkdiSFY0SUVScGMzQmhkR05vWlhKY2JpQXFYRzRnS2lCRWFYTndZWFJqYUdWeklHRmpkR2x2Ym5NZ2RHOGdiR2x6ZEdWdVpYSnpJSEpsWjJsemRHVnlaV1FnZFhOcGJtY2diMjVCWTNScGIyNHVYRzRnS2lCQlkzUnBiMjV6SUdGeVpTQmtaV3hwZG1WeVpDQmhjeUJ3WVhsc2IyRmtjeUJzYVd0bFhHNGdLaUFnSUh0aFkzUnBiMjQ2SUNkamFHRnVaMlZUWlhSMGFXNW5jeWNzSUdOdmJHOXlPaUJqYjJ4dmNuMWNiaUFxSUZSb1pTQW5ZV04wYVc5dUp5QnJaWGtnYVhNZ2NtVnhkV2x5WldRc0lHRnNiQ0J2ZEdobGNpQnJaWGx6SUdGeVpTQjFjQ0IwYnlCMGFHVWdZWEJ3YkdsallYUnBiMjR1WEc0Z0tpOWNiblpoY2lCQ1lXTnJZbTl1WlVWMlpXNTBjeUE5SUhKbGNYVnBjbVVvWENKaVlXTnJZbTl1WlMxbGRtVnVkSE10YzNSaGJtUmhiRzl1WlZ3aUtUdGNibHh1Ylc5a2RXeGxMbVY0Y0c5eWRITWdQU0JFYVhOd1lYUmphR1Z5WEc1Y2JtWjFibU4wYVc5dUlFUnBjM0JoZEdOb1pYSW9LU0I3WEc0Z0lDQWdkR2hwY3k1ZlpYWmxiblJsY2lBOUlFSmhZMnRpYjI1bFJYWmxiblJ6TG0xcGVHbHVLSHQ5S1Z4dWZWeHVYRzR2S2lwY2JpQXFJRVJwYzNCaGRHTm9JR0Z1SUdGamRHbHZiaTVjYmlBcUlGVnpZV2RsT2x4dUlDb2daR2x6Y0dGMFkyaGxjaWduWm1sa1oyVjBKeWxjYmlBcUlHUnBjM0JoZEdOb1pYSW9KMlpwWkdkbGRDY3NJSHQzYVhSb09pQW5jR1Z1WTJsc0ozMHBYRzRnS2lCa2FYTndZWFJqYUdWeUtIdGhZM1JwYjI0NklDZG1hV1JuWlhRbkxDQjNhWFJvT2lBbmNHVnVZMmxzSjMwcFhHNGdLaTljYmtScGMzQmhkR05vWlhJdWNISnZkRzkwZVhCbExtUnBjM0JoZEdOb0lEMGdablZ1WTNScGIyNG9ZV04wYVc5dUxDQndZWGxzYjJGa0tTQjdYRzRnSUNBZ2FXWWdLRjh1YVhOVGRISnBibWNvWVdOMGFXOXVLU2tnZTF4dUlDQWdJQ0FnSUNCd1lYbHNiMkZrSUQwZ1h5NWxlSFJsYm1Rb2UyRmpkR2x2YmpvZ1lXTjBhVzl1ZlN3Z2NHRjViRzloWkNsY2JpQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0J3WVhsc2IyRmtJRDBnWVdOMGFXOXVYRzRnSUNBZ2ZWeHVJQ0FnSUdOdmJuTnZiR1V1Ykc5bktHQmthWE53WVhSamFEb2dKSHR3WVhsc2IyRmtMbUZqZEdsdmJuMWdLVnh1SUNBZ0lIUm9hWE11WDJWMlpXNTBaWEl1ZEhKcFoyZGxjaWduWVdOMGFXOXVKeXdnY0dGNWJHOWhaQ2xjYm4xY2JseHVMeW9xWEc0Z0tpQlRhRzl5ZEdoaGJtUWdkRzhnY0hKbGNHRnlaU0JoSUhOcGJYQnNaU0JrYVhOd1lYUmphQ0JtZFc1amRHbHZiaTVjYmlBcUlFUnZaWE1nYm05MElHWnBjbVVnWVc0Z1pYWmxiblFzSUdKMWRDQnlaWFIxY201eklHRWdablZ1WTNScGIyNGdkR2hoZENCallXNHVYRzRnS2lCVWFHVnpaU0JoY21VZ1pYRjFhWFpoYkdWdWREcGNiaUFxSUdScGMzQmhkR05vWlhJdVltRnJaU2duWTJoaGJtZGxVMlYwZEdsdVp5Y3NJQ2RqYjJ4dmNpY3BYRzRnS2lBb1kyOXNiM0lwSUQwK0lIc2daR2x6Y0dGMFkyaGxjaTVrYVhOd1lYUmphQ2duWTJoaGJtZGxVMlYwZEdsdVp5Y3NJSHRqYjJ4dmNqb2dZMjlzYjNKOUtTQjlYRzRnS2k5Y2JrUnBjM0JoZEdOb1pYSXVjSEp2ZEc5MGVYQmxMbUpoYTJVZ1BTQm1kVzVqZEdsdmJpaGhZM1JwYjI0c0lHWnBaV3hrS1NCN1hHNGdJQ0FnY21WMGRYSnVJR1oxYm1OMGFXOXVLR2x1Y0hWMEtTQjdYRzRnSUNBZ0lDQWdJSFpoY2lCd1lYbHNiMkZrSUQwZ2UyRmpkR2x2YmpvZ1lXTjBhVzl1ZlZ4dUlDQWdJQ0FnSUNCcFppQW9abWxsYkdRZ0lUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndZWGxzYjJGa1cyWnBaV3hrWFNBOUlHbHVjSFYwWEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVhOd1lYUmphQ2h3WVhsc2IyRmtLVnh1SUNBZ0lIMHVZbWx1WkNoMGFHbHpLVnh1ZlZ4dVhHNHZLaXBjYmlBcUlGSmxaMmx6ZEdWeUlHRWdZMkZzYkdKaFkyc2dkRzhnY21WalpXbDJaU0JoYkd3Z1lXTjBhVzl1Y3k1Y2JpQXFJRVY0WVcxd2JHVTZYRzRnS2lCa2FYTndZWFJqYUdWeUxtOXVRV04wYVc5dUtDaGhZM1JwYjI0cElEMCtJSHRjYmlBcUlDQWdZMjl1YzI5c1pTNXNiMmNvWUdkdmRDQmhZM1JwYjI0Z2IyWWdkSGx3WlNBa2UzQmhlV3h2WVdRdVlXTjBhVzl1ZldCY2JpQXFJSDBwWEc0Z0tpOWNia1JwYzNCaGRHTm9aWEl1Y0hKdmRHOTBlWEJsTG05dVFXTjBhVzl1SUQwZ1puVnVZM1JwYjI0b1kyRnNiR0poWTJzcElIdGNiaUFnSUNCMGFHbHpMbDlsZG1WdWRHVnlMbTl1S0NkaFkzUnBiMjRuTENCallXeHNZbUZqYXlsY2JuMWNibHh1THlvcVhHNGdLaUJWYm5KbFoybHpkR1Z5SUdFZ1kyRnNiR0poWTJzZ2NISmxkbWx2ZFhOc2VTQnlaV2RwYzNSbGNtVmtJSGRwZEdnZ2IyNUJZM1JwYjI0dVhHNGdLaTljYmtScGMzQmhkR05vWlhJdWNISnZkRzkwZVhCbExtOW1aa0ZqZEdsdmJpQTlJR1oxYm1OMGFXOXVLR05oYkd4aVlXTnJLU0I3WEc0Z0lDQWdkR2hwY3k1ZlpYWmxiblJsY2k1dlptWW9KMkZqZEdsdmJpY3NJR05oYkd4aVlXTnJLVnh1ZlZ4dUlsMTkiLCJ2YXIgU3RvcmUgPSByZXF1aXJlKCcuL3N0b3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lU3RhdGVcblxuZnVuY3Rpb24gR2FtZVN0YXRlKGRpc3BhdGNoZXIpIHtcbiAgICBTdG9yZS5taXhpbih0aGlzKVxuXG4gICAgdGhpcy5wbGF5ZXJOYW1lcyA9IFsnTWlsZXMnLCAnSmVzcycsICdBbmRyZXMnLCAnQ2Fyb2x5bicsICdEclxcdTAwZmNjaycsICdUYXlsb3InLCAnQWtzaGF0J11cbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgICBtZXJsaW46IHRydWUsXG4gICAgICAgIG1vcmRyZWQ6IGZhbHNlLFxuICAgICAgICBwZXJjaXZhbDogZmFsc2UsXG4gICAgICAgIG1vcmdhbmE6IGZhbHNlLFxuICAgICAgICBvYmVyb246IGZhbHNlXG4gICAgfVxuICAgIHRoaXMucm9sZXMgPSBudWxsXG4gICAgLy8gUmVhc29uIHRoYXQgcm9sZXMgY2Fubm90IGJlIGFzc2lnbmVkLlxuICAgIC8vIE9uZSBvZjogdG9vTWFueSwgdG9vRmV3XG4gICAgdGhpcy5kaXNhYmxlZFJlYXNvbiA9IG51bGxcblxuICAgIHRoaXMudXBkYXRlUm9sZXMoKVxuXG4gICAgZGlzcGF0Y2hlci5vbkFjdGlvbihmdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgICAgIHZhciBhY3Rpb25zID0gR2FtZVN0YXRlLmFjdGlvbnNcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihhY3Rpb25zW3BheWxvYWQuYWN0aW9uXSkpIHtcbiAgICAgICAgICAgIGFjdGlvbnNbcGF5bG9hZC5hY3Rpb25dLmNhbGwodGhpcywgcGF5bG9hZClcbiAgICAgICAgICAgIHRoaXMuc2F2ZSgpXG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpXG59XG5cbnZhciBQRVJTSVNUX0tFWVMgPSBbJ3BsYXllck5hbWVzJywgJ3NldHRpbmdzJywgJ3JvbGVzJywgJ2Rpc2FibGVkUmVhc29uJ11cblxuR2FtZVN0YXRlLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBlcnNpc3QgPSB7fVxuICAgIFBFUlNJU1RfS0VZUy5mb3JFYWNoKGtleSA9PiBwZXJzaXN0W2tleV0gPSB0aGlzW2tleV0pXG4gICAgc3RvcmUuc2V0KCdzdG9yZS5nYW1lc3RhdGUnLCBwZXJzaXN0KVxufVxuXG5HYW1lU3RhdGUucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGVyc2lzdCA9IHN0b3JlLmdldCgnc3RvcmUuZ2FtZXN0YXRlJylcbiAgICBpZiAocGVyc2lzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFBFUlNJU1RfS0VZUy5mb3JFYWNoKGtleSA9PiB0aGlzW2tleV0gPSBwZXJzaXN0W2tleV0pXG4gICAgfVxuICAgIHRoaXMudXBkYXRlUm9sZXMoKVxufVxuXG4vKipcbiAqIEdldCBhIHJvbGUgZm9yIGEgdXNlci5cbiAqIEFkZHMgc29tZSBleHRyYSB1c2VmdWwgaW5mbyB0byB0aGUgcmV0dXJuZWQgcm9sZS5cbiAqL1xuR2FtZVN0YXRlLnByb3RvdHlwZS5nZXRSb2xlID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmICh0aGlzLnJvbGVzID09PSBudWxsKSByZXR1cm4gbnVsbFxuICAgIHZhciByb2xlID0gXy5leHRlbmQoe30sIHRoaXMucm9sZXNbbmFtZV0pXG4gICAgaWYgKHJvbGUuc3B5KSB7XG4gICAgICAgIHJvbGUub3RoZXJTcGllcyA9IF8uZmlsdGVyKHRoaXMuZ2V0U3BpZXMoKSwgKHRoZWlyTmFtZSkgPT5cbiAgICAgICAgICAgICF0aGlzLnJvbGVzW3RoZWlyTmFtZV0ub2Jlcm9uICYmIG5hbWUgIT0gdGhlaXJOYW1lKTtcblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5vYmVyb24pIHtcbiAgICAgICAgICAgIHJvbGUuaGFzT2Jlcm9uID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocm9sZS5tZXJsaW4pIHtcbiAgICAgICAgcm9sZS5zcGllcyA9IF8uZmlsdGVyKHRoaXMuZ2V0U3BpZXMoKSwgKG5hbWUpID0+XG4gICAgICAgICAgICAhdGhpcy5yb2xlc1tuYW1lXS5tb3JkcmVkKTtcbiAgICB9XG4gICAgaWYgKHJvbGUucGVyY2l2YWwpIHtcbiAgICAgICAgcm9sZS5tZXJsaW5zID0gdGhpcy5nZXRNZXJsaW5zKClcbiAgICB9XG4gICAgcmV0dXJuIHJvbGVcbn1cblxuR2FtZVN0YXRlLnByb3RvdHlwZS5nZXRTcGllcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLmZpbHRlcih0aGlzLnBsYXllck5hbWVzLCAobmFtZSkgPT5cbiAgICAgICAgdGhpcy5yb2xlc1tuYW1lXS5zcHkpXG59XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuZ2V0TWVybGlucyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLmZpbHRlcih0aGlzLnBsYXllck5hbWVzLCAobmFtZSkgPT5cbiAgICAgICAgdGhpcy5yb2xlc1tuYW1lXS5tb3JnYW5hIHx8IHRoaXMucm9sZXNbbmFtZV0ubWVybGluKTtcbn1cblxuLyoqXG4gKiBUcnkgdG8gYXNzaWduIHJvbGVzLlxuICogVGhpcyBzaG91bGQgbm90IGJlIGNhbGxlZCBpZiBpdCdzIG5vdCBwb3NzaWJsZS5cbiAqL1xuR2FtZVN0YXRlLnByb3RvdHlwZS5hc3NpZ25Sb2xlcyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHBsYXllcnMgICAgNSA2IDcgOCA5IDEwXG4gICAgLy8gcmVzaXN0YW5jZSAzIDQgNCA1IDYgNlxuICAgIC8vIHNweSAgICAgICAgMiAyIDMgMyAzIDRcbiAgICAvLyB2YXIgcmVzaXN0YW5jZSA9IHs1OiAzLCA2OiA0LCA3OiA0LCA4OiA1LCA5OiA2LCAxMDogNix9XG5cbiAgICB2YXIgbnVtUGxheWVycyA9IHRoaXMucGxheWVyTmFtZXMubGVuZ3RoXG4gICAgdmFyIG51bVNwaWVzID0gezU6IDIsIDY6IDIsIDc6IDMsIDg6IDMsIDk6IDMsIDEwOiA0LH1bbnVtUGxheWVyc11cbiAgICB2YXIgc2h1ZmZsZWROYW1lcyA9IF8uc2h1ZmZsZSh0aGlzLnBsYXllck5hbWVzKVxuXG4gICAgLy8gQXNzaWduIGluaXRpYWwgcm9sZXNcbiAgICB0aGlzLnJvbGVzID0ge31cbiAgICBzaHVmZmxlZE5hbWVzLmZvckVhY2goKG5hbWUsIGkpID0+IHtcbiAgICAgICAgdGhpcy5yb2xlc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIHNweTogaSA8IG51bVNwaWVzLFxuICAgICAgICB9XG4gICAgfSlcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgcGxheWVycyB3aG8gaGF2ZW4ndCBiZWVuIGFzc2lnbmVkIHNwZWNpYWwgcm9sZXNcbiAgICB2YXIgdW5hc3NpZ25lZFNwaWVzID0gc2h1ZmZsZWROYW1lcy5zbGljZSgwLCBudW1TcGllcyk7XG4gICAgdmFyIHVuYXNzaWduZWRSZXNpc3RhbmNlID0gc2h1ZmZsZWROYW1lcy5zbGljZShudW1TcGllcyk7XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5tZXJsaW4pIHtcbiAgICAgICAgdmFyIG1lcmxpbk5hbWUgPSB1bmFzc2lnbmVkUmVzaXN0YW5jZVswXTtcbiAgICAgICAgdW5hc3NpZ25lZFJlc2lzdGFuY2Uuc3BsaWNlKDAsMSk7XG4gICAgICAgIHRoaXMucm9sZXNbbWVybGluTmFtZV0ubWVybGluID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MubW9yZ2FuYSkge1xuICAgICAgICB2YXIgbW9yZ2FuYU5hbWUgPSB1bmFzc2lnbmVkU3BpZXNbMF07XG4gICAgICAgIHVuYXNzaWduZWRTcGllcy5zcGxpY2UoMCwxKTtcbiAgICAgICAgdGhpcy5yb2xlc1ttb3JnYW5hTmFtZV0ubW9yZ2FuYSA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnNldHRpbmdzLnBlcmNpdmFsKSB7XG4gICAgICAgIHZhciBwZXJjaXZhbE5hbWUgPSB1bmFzc2lnbmVkUmVzaXN0YW5jZVswXTtcbiAgICAgICAgdW5hc3NpZ25lZFJlc2lzdGFuY2Uuc3BsaWNlKDAsMSk7XG4gICAgICAgIHRoaXMucm9sZXNbcGVyY2l2YWxOYW1lXS5wZXJjaXZhbCA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnNldHRpbmdzLm1vcmRyZWQpIHtcbiAgICAgICAgdmFyIG1vcmRyZWROYW1lID0gdW5hc3NpZ25lZFNwaWVzWzBdO1xuICAgICAgICB1bmFzc2lnbmVkU3BpZXMuc3BsaWNlKDAsMSk7XG4gICAgICAgIHRoaXMucm9sZXNbbW9yZHJlZE5hbWVdLm1vcmRyZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5vYmVyb24pIHtcbiAgICAgICAgdmFyIG9iZXJvbk5hbWUgPSB1bmFzc2lnbmVkU3BpZXNbMF07XG4gICAgICAgIHVuYXNzaWduZWRTcGllcy5zcGxpY2UoMCwxKTtcbiAgICAgICAgdGhpcy5yb2xlc1tvYmVyb25OYW1lXS5vYmVyb24gPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdENoYW5nZSgpXG59XG5cbi8qKlxuICogTWFrZSBzdXJlIHRoYXQgcm9sZXMgZXhpc3QgaWYgdGhleSBjYW4uXG4gKiBjbGVhciAtIHdoZXRoZXIgdG8gY2xlYXIgZXhpc3Rpbmcgcm9sZXNcbiAqL1xuR2FtZVN0YXRlLnByb3RvdHlwZS51cGRhdGVSb2xlcyA9IGZ1bmN0aW9uKGNsZWFyKSB7XG4gICAgaWYgKGNsZWFyKSB7XG4gICAgICAgIHRoaXMucm9sZXMgPSBudWxsXG4gICAgfVxuXG4gICAgLy8gVXNlIGV4aXN0aW5nIHJvbGVzIGlmIHRoZXkgc3RpbGwgZXhpc3QuXG4gICAgaWYgKHRoaXMucm9sZXMgIT09IG51bGwpIHJldHVyblxuXG4gICAgaWYgKHRoaXMucGxheWVyTmFtZXMubGVuZ3RoIDwgNSkge1xuICAgICAgICB0aGlzLmRpc2FibGVkUmVhc29uID0gJ3Rvb0ZldydcbiAgICB9IGVsc2UgaWYgKHRoaXMucGxheWVyTmFtZXMubGVuZ3RoID4gMTApIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlZFJlYXNvbiA9ICd0b29NYW55J1xuICAgIH0gZWxzZSBpZiAodGhpcy5wbGF5ZXJOYW1lcy5sZW5ndGggPCA3XG4gICAgICAgICAgICAmJiB0aGlzLnNldHRpbmdzLm1vcmRyZWRcbiAgICAgICAgICAgICYmIHRoaXMuc2V0dGluZ3MubW9yZ2FuYVxuICAgICAgICAgICAgJiYgdGhpcy5zZXR0aW5ncy5vYmVyb24pIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlZFJlYXNvbiA9ICd0b29GZXcnXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlZFJlYXNvbiA9IG51bGxcbiAgICAgICAgdGhpcy5hc3NpZ25Sb2xlcygpXG4gICAgfVxufVxuXG5HYW1lU3RhdGUuYWN0aW9ucyA9IHt9XG5cbkdhbWVTdGF0ZS5hY3Rpb25zLmFkZFBsYXllciA9IGZ1bmN0aW9uKHtuYW1lfSkge1xuICAgIGlmICghXy5jb250YWlucyh0aGlzLnBsYXllck5hbWVzLCBuYW1lKSkge1xuICAgICAgICB0aGlzLnBsYXllck5hbWVzLnB1c2gobmFtZSlcbiAgICAgICAgdGhpcy51cGRhdGVSb2xlcyh0cnVlKVxuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKVxuICAgIH1cbn1cblxuR2FtZVN0YXRlLmFjdGlvbnMuZGVsZXRlUGxheWVyID0gZnVuY3Rpb24oe25hbWV9KSB7XG4gICAgdGhpcy5wbGF5ZXJOYW1lcyA9IF8ud2l0aG91dCh0aGlzLnBsYXllck5hbWVzLCBuYW1lKVxuICAgIHRoaXMudXBkYXRlUm9sZXModHJ1ZSlcbiAgICB0aGlzLmVtaXRDaGFuZ2UoKVxufVxuXG5HYW1lU3RhdGUuYWN0aW9ucy5jaGFuZ2VTZXR0aW5ncyA9IGZ1bmN0aW9uKHtzZXR0aW5nc30pIHtcbiAgICBfLmV4dGVuZCh0aGlzLnNldHRpbmdzLCBzZXR0aW5ncylcbiAgICB0aGlzLnVwZGF0ZVJvbGVzKHRydWUpXG4gICAgdGhpcy5lbWl0Q2hhbmdlKClcbn1cblxuR2FtZVN0YXRlLmFjdGlvbnMubmV3Um9sZXMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnVwZGF0ZVJvbGVzKHRydWUpXG59XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaUwyaHZiV1V2Yldsc1pYTXZZMjlrWlM5eVpXRmpkR0Z1WTJVdmMyTnlhWEIwY3k5bllXMWxMWE4wWVhSbExtcHpJaXdpYzI5MWNtTmxjeUk2V3lJdmFHOXRaUzl0YVd4bGN5OWpiMlJsTDNKbFlXTjBZVzVqWlM5elkzSnBjSFJ6TDJkaGJXVXRjM1JoZEdVdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklrRkJRVUVzU1VGQlNTeExRVUZMTEVkQlFVY3NUMEZCVHl4RFFVRkRMRk5CUVZNc1EwRkJRenM3UVVGRk9VSXNUVUZCVFN4RFFVRkRMRTlCUVU4c1IwRkJSeXhUUVVGVE96dEJRVVV4UWl4VFFVRlRMRk5CUVZNc1EwRkJReXhWUVVGVkxFVkJRVVU3UVVGREwwSXNTVUZCU1N4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF6czdTVUZGYWtJc1NVRkJTU3hEUVVGRExGZEJRVmNzUjBGQlJ5eERRVUZETEU5QlFVOHNSVUZCUlN4TlFVRk5MRVZCUVVVc1VVRkJVU3hGUVVGRkxGTkJRVk1zUlVGQlJTeFpRVUZaTEVWQlFVVXNVVUZCVVN4RlFVRkZMRkZCUVZFc1EwRkJRenRKUVVNelJpeEpRVUZKTEVOQlFVTXNVVUZCVVN4SFFVRkhPMUZCUTFvc1RVRkJUU3hGUVVGRkxFbEJRVWs3VVVGRFdpeFBRVUZQTEVWQlFVVXNTMEZCU3p0UlFVTmtMRkZCUVZFc1JVRkJSU3hMUVVGTE8xRkJRMllzVDBGQlR5eEZRVUZGTEV0QlFVczdVVUZEWkN4TlFVRk5MRVZCUVVVc1MwRkJTenRMUVVOb1FqdEJRVU5NTEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSk8wRkJRM0pDT3p0QlFVVkJMRWxCUVVrc1NVRkJTU3hEUVVGRExHTkJRV01zUjBGQlJ5eEpRVUZKT3p0QlFVVTVRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eFhRVUZYTEVWQlFVVTdPMGxCUld4Q0xGVkJRVlVzUTBGQlF5eFJRVUZSTEVOQlFVTXNVMEZCVXl4UFFVRlBMRVZCUVVVN1VVRkRiRU1zU1VGQlNTeFBRVUZQTEVkQlFVY3NVMEZCVXl4RFFVRkRMRTlCUVU4N1VVRkRMMElzU1VGQlNTeERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRTlCUVU4c1EwRkJReXhQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlR0WlFVTjJReXhQUVVGUExFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzVDBGQlR5eERRVUZETzFsQlF6TkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVU3VTBGRFpEdExRVU5LTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8wRkJRMnBDTEVOQlFVTTdPMEZCUlVRc1NVRkJTU3haUVVGWkxFZEJRVWNzUTBGQlF5eGhRVUZoTEVWQlFVVXNWVUZCVlN4RlFVRkZMRTlCUVU4c1JVRkJSU3huUWtGQlowSXNRMEZCUXpzN1FVRkZla1VzVTBGQlV5eERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1YwRkJWenRKUVVOc1F5eEpRVUZKTEU5QlFVOHNSMEZCUnl4RlFVRkZPMGxCUTJoQ0xGbEJRVmtzUTBGQlF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkRja1FzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeFBRVUZQTEVOQlFVTTdRVUZEZWtNc1EwRkJRenM3UVVGRlJDeFRRVUZUTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhYUVVGWE8wbEJRMnhETEVsQlFVa3NUMEZCVHl4SFFVRkhMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zYVVKQlFXbENMRU5CUVVNN1NVRkRNVU1zU1VGQlNTeFBRVUZQTEV0QlFVc3NVMEZCVXl4RlFVRkZPMUZCUTNaQ0xGbEJRVmtzUTBGQlF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRlRVE3U1VGRFJDeEpRVUZKTEVOQlFVTXNWMEZCVnl4RlFVRkZPMEZCUTNSQ0xFTkJRVU03TzBGQlJVUTdRVUZEUVRzN1IwRkZSenRCUVVOSUxGTkJRVk1zUTBGQlF5eFRRVUZUTEVOQlFVTXNUMEZCVHl4SFFVRkhMRk5CUVZNc1NVRkJTU3hGUVVGRk8wbEJRM3BETEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1MwRkJTeXhKUVVGSkxFVkJRVVVzVDBGQlR5eEpRVUZKTzBsQlEzQkRMRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTVUZEZWtNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlExWXNTVUZCU1N4RFFVRkRMRlZCUVZVc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRVZCUVVVc1JVRkJSU3hEUVVGRExGTkJRVk03UVVGRE9VUXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNUVUZCVFN4SlFVRkpMRWxCUVVrc1NVRkJTU3hUUVVGVExFTkJRVU1zUTBGQlF6czdVVUZGZUVRc1NVRkJTU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEUxQlFVMHNSVUZCUlR0WlFVTjBRaXhKUVVGSkxFTkJRVU1zVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXp0VFFVTjZRanRMUVVOS08wbEJRMFFzU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUTJJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFVkJRVVVzUlVGQlJTeERRVUZETEVsQlFVazdXVUZEZUVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8wdEJRMnhETzBsQlEwUXNTVUZCU1N4SlFVRkpMRU5CUVVNc1VVRkJVU3hGUVVGRk8xRkJRMllzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hGUVVGRk8wdEJRMjVETzBsQlEwUXNUMEZCVHl4SlFVRkpPMEZCUTJZc1EwRkJRenM3UVVGRlJDeFRRVUZUTEVOQlFVTXNVMEZCVXl4RFFVRkRMRkZCUVZFc1IwRkJSeXhYUVVGWE8wbEJRM1JETEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVOQlFVTXNTVUZCU1R0UlFVTnVReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJRenRCUVVNM1FpeERRVUZET3p0QlFVVkVMRk5CUVZNc1EwRkJReXhUUVVGVExFTkJRVU1zVlVGQlZTeEhRVUZITEZkQlFWYzdTVUZEZUVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhKUVVGSk8xRkJRMjVETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zVDBGQlR5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdRVUZETjBRc1EwRkJRenM3UVVGRlJEdEJRVU5CT3p0SFFVVkhPMEZCUTBnc1UwRkJVeXhEUVVGRExGTkJRVk1zUTBGQlF5eFhRVUZYTEVkQlFVY3NWMEZCVnp0QlFVTTNRenRCUVVOQk8wRkJRMEU3UVVGRFFUczdTVUZGU1N4SlFVRkpMRlZCUVZVc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEUxQlFVMDdTVUZEZUVNc1NVRkJTU3hSUVVGUkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExGVkJRVlVzUTBGQlF6dEJRVU55UlN4SlFVRkpMRWxCUVVrc1lVRkJZU3hIUVVGSExFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJRenRCUVVOdVJEczdTVUZGU1N4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFVkJRVVU3U1VGRFppeGhRVUZoTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUzBGQlN6dFJRVU12UWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITzFsQlEyWXNSMEZCUnl4RlFVRkZMRU5CUVVNc1IwRkJSeXhSUVVGUk8xTkJRM0JDTzBGQlExUXNTMEZCU3l4RFFVRkRPMEZCUTA0N08wbEJSVWtzU1VGQlNTeGxRVUZsTEVkQlFVY3NZVUZCWVN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdRVUZETTBRc1NVRkJTU3hKUVVGSkxHOUNRVUZ2UWl4SFFVRkhMR0ZCUVdFc1EwRkJReXhMUVVGTExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdPMGxCUlhwRUxFbEJRVWtzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRVZCUVVVN1VVRkRkRUlzU1VGQlNTeFZRVUZWTEVkQlFVY3NiMEpCUVc5Q0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZWtNc2IwSkJRVzlDTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5xUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNN1MwRkRlRU03U1VGRFJDeEpRVUZKTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1QwRkJUeXhGUVVGRk8xRkJRM1pDTEVsQlFVa3NWMEZCVnl4SFFVRkhMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UXl4bFFVRmxMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU03UzBGRE1VTTdTVUZEUkN4SlFVRkpMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zVVVGQlVTeEZRVUZGTzFGQlEzaENMRWxCUVVrc1dVRkJXU3hIUVVGSExHOUNRVUZ2UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRek5ETEc5Q1FVRnZRaXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha01zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETzB0QlF6VkRPMGxCUTBRc1NVRkJTU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEU5QlFVOHNSVUZCUlR0UlFVTjJRaXhKUVVGSkxGZEJRVmNzUjBGQlJ5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRja01zWlVGQlpTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRPMHRCUXpGRE8wbEJRMFFzU1VGQlNTeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1JVRkJSVHRSUVVOMFFpeEpRVUZKTEZWQlFWVXNSMEZCUnl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNFTXNaVUZCWlN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETlVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRE8wRkJRemRETEV0QlFVczdPMGxCUlVRc1NVRkJTU3hEUVVGRExGVkJRVlVzUlVGQlJUdEJRVU55UWl4RFFVRkRPenRCUVVWRU8wRkJRMEU3TzBkQlJVYzdRVUZEU0N4VFFVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRExGZEJRVmNzUjBGQlJ5eFRRVUZUTEV0QlFVc3NSVUZCUlR0SlFVTTVReXhKUVVGSkxFdEJRVXNzUlVGQlJUdFJRVU5RTEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTVHRCUVVONlFpeExRVUZMTzBGQlEwdzdPMEZCUlVFc1NVRkJTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEV0QlFVc3NTVUZCU1N4RlFVRkZMRTFCUVUwN08wbEJSUzlDTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTzFGQlF6ZENMRWxCUVVrc1EwRkJReXhqUVVGakxFZEJRVWNzVVVGQlVUdExRVU5xUXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RlFVRkZPMUZCUTNKRExFbEJRVWtzUTBGQlF5eGpRVUZqTEVkQlFVY3NVMEZCVXp0TFFVTnNReXhOUVVGTkxFbEJRVWtzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJRenRsUVVNelFpeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRTlCUVU4N1pVRkRja0lzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4UFFVRlBPMlZCUTNKQ0xFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUXpkQ0xFbEJRVWtzUTBGQlF5eGpRVUZqTEVkQlFVY3NVVUZCVVR0TFFVTnFReXhOUVVGTk8xRkJRMGdzU1VGQlNTeERRVUZETEdOQlFXTXNSMEZCUnl4SlFVRkpPMUZCUXpGQ0xFbEJRVWtzUTBGQlF5eFhRVUZYTEVWQlFVVTdTMEZEY2tJN1FVRkRUQ3hEUVVGRE96dEJRVVZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1JVRkJSVHM3UVVGRmRFSXNVMEZCVXl4RFFVRkRMRTlCUVU4c1EwRkJReXhUUVVGVExFZEJRVWNzVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMGxCUXpORExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhYUVVGWExFVkJRVVVzU1VGQlNTeERRVUZETEVWQlFVVTdVVUZEY2tNc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUXpOQ0xFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUTNSQ0xFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVTdTMEZEY0VJN1FVRkRUQ3hEUVVGRE96dEJRVVZFTEZOQlFWTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1dVRkJXU3hIUVVGSExGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0SlFVTTVReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eEhRVUZITEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExGZEJRVmNzUlVGQlJTeEpRVUZKTEVOQlFVTTdTVUZEY0VRc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEZEVJc1NVRkJTU3hEUVVGRExGVkJRVlVzUlVGQlJUdEJRVU55UWl4RFFVRkRPenRCUVVWRUxGTkJRVk1zUTBGQlF5eFBRVUZQTEVOQlFVTXNZMEZCWXl4SFFVRkhMRk5CUVZNc1EwRkJReXhSUVVGUkxFTkJRVU1zUlVGQlJUdEpRVU53UkN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVWQlFVVXNVVUZCVVN4RFFVRkRPMGxCUTJwRExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTNSQ0xFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVTdRVUZEY2tJc1EwRkJRenM3UVVGRlJDeFRRVUZUTEVOQlFVTXNUMEZCVHl4RFFVRkRMRkZCUVZFc1IwRkJSeXhYUVVGWE8wbEJRM0JETEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1NVRkJTU3hEUVVGRE8wTkJRM3BDSWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaWRtRnlJRk4wYjNKbElEMGdjbVZ4ZFdseVpTZ25MaTl6ZEc5eVpTY3BYRzVjYm0xdlpIVnNaUzVsZUhCdmNuUnpJRDBnUjJGdFpWTjBZWFJsWEc1Y2JtWjFibU4wYVc5dUlFZGhiV1ZUZEdGMFpTaGthWE53WVhSamFHVnlLU0I3WEc0Z0lDQWdVM1J2Y21VdWJXbDRhVzRvZEdocGN5bGNibHh1SUNBZ0lIUm9hWE11Y0d4aGVXVnlUbUZ0WlhNZ1BTQmJKMDFwYkdWekp5d2dKMHBsYzNNbkxDQW5RVzVrY21Wekp5d2dKME5oY205c2VXNG5MQ0FuUkhKY1hIVXdNR1pqWTJzbkxDQW5WR0Y1Ykc5eUp5d2dKMEZyYzJoaGRDZGRYRzRnSUNBZ2RHaHBjeTV6WlhSMGFXNW5jeUE5SUh0Y2JpQWdJQ0FnSUNBZ2JXVnliR2x1T2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0J0YjNKa2NtVmtPaUJtWVd4elpTeGNiaUFnSUNBZ0lDQWdjR1Z5WTJsMllXdzZJR1poYkhObExGeHVJQ0FnSUNBZ0lDQnRiM0puWVc1aE9pQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ2IySmxjbTl1T2lCbVlXeHpaVnh1SUNBZ0lIMWNiaUFnSUNCMGFHbHpMbkp2YkdWeklEMGdiblZzYkZ4dUlDQWdJQzh2SUZKbFlYTnZiaUIwYUdGMElISnZiR1Z6SUdOaGJtNXZkQ0JpWlNCaGMzTnBaMjVsWkM1Y2JpQWdJQ0F2THlCUGJtVWdiMlk2SUhSdmIwMWhibmtzSUhSdmIwWmxkMXh1SUNBZ0lIUm9hWE11WkdsellXSnNaV1JTWldGemIyNGdQU0J1ZFd4c1hHNWNiaUFnSUNCMGFHbHpMblZ3WkdGMFpWSnZiR1Z6S0NsY2JseHVJQ0FnSUdScGMzQmhkR05vWlhJdWIyNUJZM1JwYjI0b1puVnVZM1JwYjI0b2NHRjViRzloWkNrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnWVdOMGFXOXVjeUE5SUVkaGJXVlRkR0YwWlM1aFkzUnBiMjV6WEc0Z0lDQWdJQ0FnSUdsbUlDaGZMbWx6Um5WdVkzUnBiMjRvWVdOMGFXOXVjMXR3WVhsc2IyRmtMbUZqZEdsdmJsMHBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmhZM1JwYjI1elczQmhlV3h2WVdRdVlXTjBhVzl1WFM1allXeHNLSFJvYVhNc0lIQmhlV3h2WVdRcFhHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxuTmhkbVVvS1Z4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlM1aWFXNWtLSFJvYVhNcEtWeHVmVnh1WEc1MllYSWdVRVZTVTBsVFZGOUxSVmxUSUQwZ1d5ZHdiR0Y1WlhKT1lXMWxjeWNzSUNkelpYUjBhVzVuY3ljc0lDZHliMnhsY3ljc0lDZGthWE5oWW14bFpGSmxZWE52YmlkZFhHNWNia2RoYldWVGRHRjBaUzV3Y205MGIzUjVjR1V1YzJGMlpTQTlJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJSFpoY2lCd1pYSnphWE4wSUQwZ2UzMWNiaUFnSUNCUVJWSlRTVk5VWDB0RldWTXVabTl5UldGamFDaHJaWGtnUFQ0Z2NHVnljMmx6ZEZ0clpYbGRJRDBnZEdocGMxdHJaWGxkS1Z4dUlDQWdJSE4wYjNKbExuTmxkQ2duYzNSdmNtVXVaMkZ0WlhOMFlYUmxKeXdnY0dWeWMybHpkQ2xjYm4xY2JseHVSMkZ0WlZOMFlYUmxMbkJ5YjNSdmRIbHdaUzVzYjJGa0lEMGdablZ1WTNScGIyNG9LU0I3WEc0Z0lDQWdkbUZ5SUhCbGNuTnBjM1FnUFNCemRHOXlaUzVuWlhRb0ozTjBiM0psTG1kaGJXVnpkR0YwWlNjcFhHNGdJQ0FnYVdZZ0tIQmxjbk5wYzNRZ0lUMDlJSFZ1WkdWbWFXNWxaQ2tnZTF4dUlDQWdJQ0FnSUNCUVJWSlRTVk5VWDB0RldWTXVabTl5UldGamFDaHJaWGtnUFQ0Z2RHaHBjMXRyWlhsZElEMGdjR1Z5YzJsemRGdHJaWGxkS1Z4dUlDQWdJSDFjYmlBZ0lDQjBhR2x6TG5Wd1pHRjBaVkp2YkdWektDbGNibjFjYmx4dUx5b3FYRzRnS2lCSFpYUWdZU0J5YjJ4bElHWnZjaUJoSUhWelpYSXVYRzRnS2lCQlpHUnpJSE52YldVZ1pYaDBjbUVnZFhObFpuVnNJR2x1Wm04Z2RHOGdkR2hsSUhKbGRIVnlibVZrSUhKdmJHVXVYRzRnS2k5Y2JrZGhiV1ZUZEdGMFpTNXdjbTkwYjNSNWNHVXVaMlYwVW05c1pTQTlJR1oxYm1OMGFXOXVLRzVoYldVcElIdGNiaUFnSUNCcFppQW9kR2hwY3k1eWIyeGxjeUE5UFQwZ2JuVnNiQ2tnY21WMGRYSnVJRzUxYkd4Y2JpQWdJQ0IyWVhJZ2NtOXNaU0E5SUY4dVpYaDBaVzVrS0h0OUxDQjBhR2x6TG5KdmJHVnpXMjVoYldWZEtWeHVJQ0FnSUdsbUlDaHliMnhsTG5Od2VTa2dlMXh1SUNBZ0lDQWdJQ0J5YjJ4bExtOTBhR1Z5VTNCcFpYTWdQU0JmTG1acGJIUmxjaWgwYUdsekxtZGxkRk53YVdWektDa3NJQ2gwYUdWcGNrNWhiV1VwSUQwK1hHNGdJQ0FnSUNBZ0lDQWdJQ0FoZEdocGN5NXliMnhsYzF0MGFHVnBjazVoYldWZExtOWlaWEp2YmlBbUppQnVZVzFsSUNFOUlIUm9aV2x5VG1GdFpTazdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tIUm9hWE11YzJWMGRHbHVaM011YjJKbGNtOXVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnliMnhsTG1oaGMwOWlaWEp2YmlBOUlIUnlkV1U3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc0Z0lDQWdhV1lnS0hKdmJHVXViV1Z5YkdsdUtTQjdYRzRnSUNBZ0lDQWdJSEp2YkdVdWMzQnBaWE1nUFNCZkxtWnBiSFJsY2loMGFHbHpMbWRsZEZOd2FXVnpLQ2tzSUNodVlXMWxLU0E5UGx4dUlDQWdJQ0FnSUNBZ0lDQWdJWFJvYVhNdWNtOXNaWE5iYm1GdFpWMHViVzl5WkhKbFpDazdYRzRnSUNBZ2ZWeHVJQ0FnSUdsbUlDaHliMnhsTG5CbGNtTnBkbUZzS1NCN1hHNGdJQ0FnSUNBZ0lISnZiR1V1YldWeWJHbHVjeUE5SUhSb2FYTXVaMlYwVFdWeWJHbHVjeWdwWEc0Z0lDQWdmVnh1SUNBZ0lISmxkSFZ5YmlCeWIyeGxYRzU5WEc1Y2JrZGhiV1ZUZEdGMFpTNXdjbTkwYjNSNWNHVXVaMlYwVTNCcFpYTWdQU0JtZFc1amRHbHZiaWdwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdYeTVtYVd4MFpYSW9kR2hwY3k1d2JHRjVaWEpPWVcxbGN5d2dLRzVoYldVcElEMCtYRzRnSUNBZ0lDQWdJSFJvYVhNdWNtOXNaWE5iYm1GdFpWMHVjM0I1S1Z4dWZWeHVYRzVIWVcxbFUzUmhkR1V1Y0hKdmRHOTBlWEJsTG1kbGRFMWxjbXhwYm5NZ1BTQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ0lDQnlaWFIxY200Z1h5NW1hV3gwWlhJb2RHaHBjeTV3YkdGNVpYSk9ZVzFsY3l3Z0tHNWhiV1VwSUQwK1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y205c1pYTmJibUZ0WlYwdWJXOXlaMkZ1WVNCOGZDQjBhR2x6TG5KdmJHVnpXMjVoYldWZExtMWxjbXhwYmlrN1hHNTlYRzVjYmk4cUtseHVJQ29nVkhKNUlIUnZJR0Z6YzJsbmJpQnliMnhsY3k1Y2JpQXFJRlJvYVhNZ2MyaHZkV3hrSUc1dmRDQmlaU0JqWVd4c1pXUWdhV1lnYVhRbmN5QnViM1FnY0c5emMybGliR1V1WEc0Z0tpOWNia2RoYldWVGRHRjBaUzV3Y205MGIzUjVjR1V1WVhOemFXZHVVbTlzWlhNZ1BTQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ0lDQXZMeUJ3YkdGNVpYSnpJQ0FnSURVZ05pQTNJRGdnT1NBeE1GeHVJQ0FnSUM4dklISmxjMmx6ZEdGdVkyVWdNeUEwSURRZ05TQTJJRFpjYmlBZ0lDQXZMeUJ6Y0hrZ0lDQWdJQ0FnSURJZ01pQXpJRE1nTXlBMFhHNGdJQ0FnTHk4Z2RtRnlJSEpsYzJsemRHRnVZMlVnUFNCN05Ub2dNeXdnTmpvZ05Dd2dOem9nTkN3Z09Eb2dOU3dnT1RvZ05pd2dNVEE2SURZc2ZWeHVYRzRnSUNBZ2RtRnlJRzUxYlZCc1lYbGxjbk1nUFNCMGFHbHpMbkJzWVhsbGNrNWhiV1Z6TG14bGJtZDBhRnh1SUNBZ0lIWmhjaUJ1ZFcxVGNHbGxjeUE5SUhzMU9pQXlMQ0EyT2lBeUxDQTNPaUF6TENBNE9pQXpMQ0E1T2lBekxDQXhNRG9nTkN4OVcyNTFiVkJzWVhsbGNuTmRYRzRnSUNBZ2RtRnlJSE5vZFdabWJHVmtUbUZ0WlhNZ1BTQmZMbk5vZFdabWJHVW9kR2hwY3k1d2JHRjVaWEpPWVcxbGN5bGNibHh1SUNBZ0lDOHZJRUZ6YzJsbmJpQnBibWwwYVdGc0lISnZiR1Z6WEc0Z0lDQWdkR2hwY3k1eWIyeGxjeUE5SUh0OVhHNGdJQ0FnYzJoMVptWnNaV1JPWVcxbGN5NW1iM0pGWVdOb0tDaHVZVzFsTENCcEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbTlzWlhOYmJtRnRaVjBnUFNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J6Y0hrNklHa2dQQ0J1ZFcxVGNHbGxjeXhjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDBwWEc1Y2JpQWdJQ0F2THlCTFpXVndJSFJ5WVdOcklHOW1JSEJzWVhsbGNuTWdkMmh2SUdoaGRtVnVKM1FnWW1WbGJpQmhjM05wWjI1bFpDQnpjR1ZqYVdGc0lISnZiR1Z6WEc0Z0lDQWdkbUZ5SUhWdVlYTnphV2R1WldSVGNHbGxjeUE5SUhOb2RXWm1iR1ZrVG1GdFpYTXVjMnhwWTJVb01Dd2diblZ0VTNCcFpYTXBPMXh1SUNBZ0lIWmhjaUIxYm1GemMybG5ibVZrVW1WemFYTjBZVzVqWlNBOUlITm9kV1ptYkdWa1RtRnRaWE11YzJ4cFkyVW9iblZ0VTNCcFpYTXBPMXh1WEc0Z0lDQWdhV1lnS0hSb2FYTXVjMlYwZEdsdVozTXViV1Z5YkdsdUtTQjdYRzRnSUNBZ0lDQWdJSFpoY2lCdFpYSnNhVzVPWVcxbElEMGdkVzVoYzNOcFoyNWxaRkpsYzJsemRHRnVZMlZiTUYwN1hHNGdJQ0FnSUNBZ0lIVnVZWE56YVdkdVpXUlNaWE5wYzNSaGJtTmxMbk53YkdsalpTZ3dMREVwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbkp2YkdWelcyMWxjbXhwYms1aGJXVmRMbTFsY214cGJpQTlJSFJ5ZFdVN1hHNGdJQ0FnZlZ4dUlDQWdJR2xtSUNoMGFHbHpMbk5sZEhScGJtZHpMbTF2Y21kaGJtRXBJSHRjYmlBZ0lDQWdJQ0FnZG1GeUlHMXZjbWRoYm1GT1lXMWxJRDBnZFc1aGMzTnBaMjVsWkZOd2FXVnpXekJkTzF4dUlDQWdJQ0FnSUNCMWJtRnpjMmxuYm1Wa1UzQnBaWE11YzNCc2FXTmxLREFzTVNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y205c1pYTmJiVzl5WjJGdVlVNWhiV1ZkTG0xdmNtZGhibUVnUFNCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnSUNCcFppQW9kR2hwY3k1elpYUjBhVzVuY3k1d1pYSmphWFpoYkNrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnY0dWeVkybDJZV3hPWVcxbElEMGdkVzVoYzNOcFoyNWxaRkpsYzJsemRHRnVZMlZiTUYwN1hHNGdJQ0FnSUNBZ0lIVnVZWE56YVdkdVpXUlNaWE5wYzNSaGJtTmxMbk53YkdsalpTZ3dMREVwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbkp2YkdWelczQmxjbU5wZG1Gc1RtRnRaVjB1Y0dWeVkybDJZV3dnUFNCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnSUNCcFppQW9kR2hwY3k1elpYUjBhVzVuY3k1dGIzSmtjbVZrS1NCN1hHNGdJQ0FnSUNBZ0lIWmhjaUJ0YjNKa2NtVmtUbUZ0WlNBOUlIVnVZWE56YVdkdVpXUlRjR2xsYzFzd1hUdGNiaUFnSUNBZ0lDQWdkVzVoYzNOcFoyNWxaRk53YVdWekxuTndiR2xqWlNnd0xERXBPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuSnZiR1Z6VzIxdmNtUnlaV1JPWVcxbFhTNXRiM0prY21Wa0lEMGdkSEoxWlR0Y2JpQWdJQ0I5WEc0Z0lDQWdhV1lnS0hSb2FYTXVjMlYwZEdsdVozTXViMkpsY205dUtTQjdYRzRnSUNBZ0lDQWdJSFpoY2lCdlltVnliMjVPWVcxbElEMGdkVzVoYzNOcFoyNWxaRk53YVdWeld6QmRPMXh1SUNBZ0lDQWdJQ0IxYm1GemMybG5ibVZrVTNCcFpYTXVjM0JzYVdObEtEQXNNU2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbTlzWlhOYmIySmxjbTl1VG1GdFpWMHViMkpsY205dUlEMGdkSEoxWlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0IwYUdsekxtVnRhWFJEYUdGdVoyVW9LVnh1ZlZ4dVhHNHZLaXBjYmlBcUlFMWhhMlVnYzNWeVpTQjBhR0YwSUhKdmJHVnpJR1Y0YVhOMElHbG1JSFJvWlhrZ1kyRnVMbHh1SUNvZ1kyeGxZWElnTFNCM2FHVjBhR1Z5SUhSdklHTnNaV0Z5SUdWNGFYTjBhVzVuSUhKdmJHVnpYRzRnS2k5Y2JrZGhiV1ZUZEdGMFpTNXdjbTkwYjNSNWNHVXVkWEJrWVhSbFVtOXNaWE1nUFNCbWRXNWpkR2x2YmloamJHVmhjaWtnZTF4dUlDQWdJR2xtSUNoamJHVmhjaWtnZTF4dUlDQWdJQ0FnSUNCMGFHbHpMbkp2YkdWeklEMGdiblZzYkZ4dUlDQWdJSDFjYmx4dUlDQWdJQzh2SUZWelpTQmxlR2x6ZEdsdVp5QnliMnhsY3lCcFppQjBhR1Y1SUhOMGFXeHNJR1Y0YVhOMExseHVJQ0FnSUdsbUlDaDBhR2x6TG5KdmJHVnpJQ0U5UFNCdWRXeHNLU0J5WlhSMWNtNWNibHh1SUNBZ0lHbG1JQ2gwYUdsekxuQnNZWGxsY2s1aGJXVnpMbXhsYm1kMGFDQThJRFVwSUh0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVrYVhOaFlteGxaRkpsWVhOdmJpQTlJQ2QwYjI5R1pYY25YRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaDBhR2x6TG5Cc1lYbGxjazVoYldWekxteGxibWQwYUNBK0lERXdLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVaR2x6WVdKc1pXUlNaV0Z6YjI0Z1BTQW5kRzl2VFdGdWVTZGNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tIUm9hWE11Y0d4aGVXVnlUbUZ0WlhNdWJHVnVaM1JvSUR3Z04xeHVJQ0FnSUNBZ0lDQWdJQ0FnSmlZZ2RHaHBjeTV6WlhSMGFXNW5jeTV0YjNKa2NtVmtYRzRnSUNBZ0lDQWdJQ0FnSUNBbUppQjBhR2x6TG5ObGRIUnBibWR6TG0xdmNtZGhibUZjYmlBZ0lDQWdJQ0FnSUNBZ0lDWW1JSFJvYVhNdWMyVjBkR2x1WjNNdWIySmxjbTl1S1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WkdsellXSnNaV1JTWldGemIyNGdQU0FuZEc5dlJtVjNKMXh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WkdsellXSnNaV1JTWldGemIyNGdQU0J1ZFd4c1hHNGdJQ0FnSUNBZ0lIUm9hWE11WVhOemFXZHVVbTlzWlhNb0tWeHVJQ0FnSUgxY2JuMWNibHh1UjJGdFpWTjBZWFJsTG1GamRHbHZibk1nUFNCN2ZWeHVYRzVIWVcxbFUzUmhkR1V1WVdOMGFXOXVjeTVoWkdSUWJHRjVaWElnUFNCbWRXNWpkR2x2YmloN2JtRnRaWDBwSUh0Y2JpQWdJQ0JwWmlBb0lWOHVZMjl1ZEdGcGJuTW9kR2hwY3k1d2JHRjVaWEpPWVcxbGN5d2dibUZ0WlNrcElIdGNiaUFnSUNBZ0lDQWdkR2hwY3k1d2JHRjVaWEpPWVcxbGN5NXdkWE5vS0c1aGJXVXBYRzRnSUNBZ0lDQWdJSFJvYVhNdWRYQmtZWFJsVW05c1pYTW9kSEoxWlNsY2JpQWdJQ0FnSUNBZ2RHaHBjeTVsYldsMFEyaGhibWRsS0NsY2JpQWdJQ0I5WEc1OVhHNWNia2RoYldWVGRHRjBaUzVoWTNScGIyNXpMbVJsYkdWMFpWQnNZWGxsY2lBOUlHWjFibU4wYVc5dUtIdHVZVzFsZlNrZ2UxeHVJQ0FnSUhSb2FYTXVjR3hoZVdWeVRtRnRaWE1nUFNCZkxuZHBkR2h2ZFhRb2RHaHBjeTV3YkdGNVpYSk9ZVzFsY3l3Z2JtRnRaU2xjYmlBZ0lDQjBhR2x6TG5Wd1pHRjBaVkp2YkdWektIUnlkV1VwWEc0Z0lDQWdkR2hwY3k1bGJXbDBRMmhoYm1kbEtDbGNibjFjYmx4dVIyRnRaVk4wWVhSbExtRmpkR2x2Ym5NdVkyaGhibWRsVTJWMGRHbHVaM01nUFNCbWRXNWpkR2x2YmloN2MyVjBkR2x1WjNOOUtTQjdYRzRnSUNBZ1h5NWxlSFJsYm1Rb2RHaHBjeTV6WlhSMGFXNW5jeXdnYzJWMGRHbHVaM01wWEc0Z0lDQWdkR2hwY3k1MWNHUmhkR1ZTYjJ4bGN5aDBjblZsS1Z4dUlDQWdJSFJvYVhNdVpXMXBkRU5vWVc1blpTZ3BYRzU5WEc1Y2JrZGhiV1ZUZEdGMFpTNWhZM1JwYjI1ekxtNWxkMUp2YkdWeklEMGdablZ1WTNScGIyNG9LU0I3WEc0Z0lDQWdkR2hwY3k1MWNHUmhkR1ZTYjJ4bGN5aDBjblZsS1Z4dWZWeHVJbDE5IiwidmFyIFRhYnMgICAgICAgICA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi90YWJzLmpzeCcpKVxudmFyIFNldHVwUGFnZSAgICA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9zZXR1cC1wYWdlLmpzeCcpKVxudmFyIFJvbGVzUGFnZSAgICA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9yb2xlcy1wYWdlLmpzeCcpKVxudmFyIE1pc3Npb25QYWdlICA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9taXNzaW9uLXBhZ2UuanN4JykpXG52YXIgRGlzcGF0Y2hlciAgID0gcmVxdWlyZSgnLi9kaXNwYXRjaGVyJylcbnZhciBVSVN0YXRlICAgICAgPSByZXF1aXJlKCcuL3VpLXN0YXRlJylcbnZhciBHYW1lU3RhdGUgICAgPSByZXF1aXJlKCcuL2dhbWUtc3RhdGUnKVxudmFyIE1pc3Npb25TdGF0ZSA9IHJlcXVpcmUoJy4vbWlzc2lvbi1zdGF0ZScpXG52YXIgc3RvcmVfcmVzZXQgID0gcmVxdWlyZSgnLi9zdG9yZS1yZXNldCcpXG5cbnZhciBkaXNwYXRjaGVyICAgPSBuZXcgRGlzcGF0Y2hlcigpXG52YXIgZGlzcGF0Y2ggICAgID0gZGlzcGF0Y2hlci5kaXNwYXRjaC5iaW5kKGRpc3BhdGNoZXIpXG52YXIgdWlzdGF0ZSAgICAgID0gbmV3IFVJU3RhdGUoZGlzcGF0Y2hlcilcbnZhciBnYW1lc3RhdGUgICAgPSBuZXcgR2FtZVN0YXRlKGRpc3BhdGNoZXIpXG52YXIgbWlzc2lvbnN0YXRlID0gbmV3IE1pc3Npb25TdGF0ZShkaXNwYXRjaGVyKVxuXG4vLyBJbmNyZWFzZSB0aGlzIG51bWJlciBhZnRlciBldmVyeSBkYXRhc3RvcmUgc2NoZW1hIGJyZWFraW5nIGNoYW5nZS5cbnN0b3JlX3Jlc2V0KDMpXG51aXN0YXRlLmxvYWQoKVxuZ2FtZXN0YXRlLmxvYWQoKVxubWlzc2lvbnN0YXRlLmxvYWQoKVxuXG52YXIgcmVuZGVyQXBwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNldHVwUGFnZSA9IFNldHVwUGFnZSh7XG4gICAgICAgIHBsYXllck5hbWVzOiBnYW1lc3RhdGUucGxheWVyTmFtZXMsIHNldHRpbmdzOiBnYW1lc3RhdGUuc2V0dGluZ3MsXG4gICAgICAgIG9uQWRkTmFtZTogZGlzcGF0Y2hlci5iYWtlKCdhZGRQbGF5ZXInLCAnbmFtZScpLFxuICAgICAgICBvbkRlbGV0ZU5hbWU6IGRpc3BhdGNoZXIuYmFrZSgnZGVsZXRlUGxheWVyJywgJ25hbWUnKSxcbiAgICAgICAgb25DaGFuZ2VTZXR0aW5nczogZGlzcGF0Y2hlci5iYWtlKCdjaGFuZ2VTZXR0aW5ncycsICdzZXR0aW5ncycpLFxuICAgICAgICBvbk5ld1JvbGVzOiBkaXNwYXRjaGVyLmJha2UoJ25ld1JvbGVzJyksXG4gICAgfSlcblxuICAgIHZhciByb2xlc1BhZ2UgPSBSb2xlc1BhZ2Uoe1xuICAgICAgICBkaXNhYmxlZFJlYXNvbjogZ2FtZXN0YXRlLmRpc2FibGVkUmVhc29uLFxuICAgICAgICBwbGF5ZXJOYW1lczogZ2FtZXN0YXRlLnBsYXllck5hbWVzLFxuICAgICAgICBzZWxlY3RlZFBsYXllcjogdWlzdGF0ZS5zZWxlY3RlZFBsYXllcixcbiAgICAgICAgc2VsZWN0ZWRSb2xlOiAgIGdhbWVzdGF0ZS5nZXRSb2xlKHVpc3RhdGUuc2VsZWN0ZWRQbGF5ZXIpLFxuICAgICAgICBzZWxlY3Rpb25Db25maXJtZWQ6IHVpc3RhdGUuc2VsZWN0aW9uQ29uZmlybWVkLFxuICAgICAgICBvbkNsaWNrU2hvdzogICAgZGlzcGF0Y2hlci5iYWtlKCdzZWxlY3RQbGF5ZXInLCAnbmFtZScpLFxuICAgICAgICBvbkNsaWNrQ29uZmlybTogZGlzcGF0Y2hlci5iYWtlKCdjb25maXJtUGxheWVyJywgJ25hbWUnKSxcbiAgICAgICAgb25DbGlja0NhbmNlbDogIGRpc3BhdGNoZXIuYmFrZSgnZGVzZWxlY3RQbGF5ZXInKSxcbiAgICAgICAgb25DbGlja09rOiAgICAgIGRpc3BhdGNoZXIuYmFrZSgnZGVzZWxlY3RQbGF5ZXInLCAnbmFtZScpLFxuICAgIH0pXG5cbiAgICB2YXIgbWlzc2lvblBhZ2UgPSBNaXNzaW9uUGFnZSh7XG4gICAgICAgIG51bVBsYXllcnM6IGdhbWVzdGF0ZS5wbGF5ZXJOYW1lcy5sZW5ndGgsXG4gICAgICAgIHBhc3NlczogbWlzc2lvbnN0YXRlLnBhc3NlcyxcbiAgICAgICAgZmFpbHM6IG1pc3Npb25zdGF0ZS5mYWlscyxcbiAgICAgICAgaGlzdG9yeTogbWlzc2lvbnN0YXRlLmhpc3RvcnksXG4gICAgICAgIHJldmVhbGVkOiB1aXN0YXRlLm1pc3Npb25SZXZlYWxlZCxcbiAgICAgICAgb25Wb3RlOiBkaXNwYXRjaGVyLmJha2UoJ21pc3Npb25Wb3RlJywgJ3Bhc3MnKSxcbiAgICAgICAgb25SZXZlYWw6IGRpc3BhdGNoZXIuYmFrZSgnbWlzc2lvblJldmVhbCcpLFxuICAgICAgICBvblJlc2V0OiBkaXNwYXRjaGVyLmJha2UoJ21pc3Npb25SZXNldCcpLFxuICAgIH0pXG5cbiAgICBSZWFjdC5yZW5kZXIoXG4gICAgICAgIFRhYnMoe1xuICAgICAgICAgICAgYWN0aXZlVGFiOiB1aXN0YXRlLnRhYixcbiAgICAgICAgICAgIG9uQ2hhbmdlVGFiOiBkaXNwYXRjaGVyLmJha2UoJ2NoYW5nZVRhYicsICd0YWInKSxcbiAgICAgICAgICAgIHRhYnM6IHtcbiAgICAgICAgICAgICAgICBzZXR1cDoge25hbWU6ICdTZXR1cCcsIGNvbnRlbnQ6IHNldHVwUGFnZX0sXG4gICAgICAgICAgICAgICAgcm9sZXM6IHtuYW1lOiAnUm9sZXMnLCBjb250ZW50OiByb2xlc1BhZ2V9LFxuICAgICAgICAgICAgICAgIG1pc3Npb246IHtuYW1lOiAnTWlzc2lvbicsIGNvbnRlbnQ6IG1pc3Npb25QYWdlfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKVxuICAgIClcbn1cblxuUmVhY3QuaW5pdGlhbGl6ZVRvdWNoRXZlbnRzKHRydWUpXG5yZW5kZXJBcHAoKVxudWlzdGF0ZS5vbkNoYW5nZShyZW5kZXJBcHApXG5nYW1lc3RhdGUub25DaGFuZ2UocmVuZGVyQXBwKVxubWlzc2lvbnN0YXRlLm9uQ2hhbmdlKHJlbmRlckFwcClcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pTDJodmJXVXZiV2xzWlhNdlkyOWtaUzl5WldGamRHRnVZMlV2YzJOeWFYQjBjeTlwYm1SbGVDNXFjeUlzSW5OdmRYSmpaWE1pT2xzaUwyaHZiV1V2Yldsc1pYTXZZMjlrWlM5eVpXRmpkR0Z1WTJVdmMyTnlhWEIwY3k5cGJtUmxlQzVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTeEpRVUZKTEVsQlFVa3NWMEZCVnl4TFFVRkxMRU5CUVVNc1lVRkJZU3hEUVVGRExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNRMEZCUXp0QlFVTTNSQ3hKUVVGSkxGTkJRVk1zVFVGQlRTeExRVUZMTEVOQlFVTXNZVUZCWVN4RFFVRkRMRTlCUVU4c1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RFFVRkRPMEZCUTI1RkxFbEJRVWtzVTBGQlV5eE5RVUZOTEV0QlFVc3NRMEZCUXl4aFFVRmhMRU5CUVVNc1QwRkJUeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1FVRkRia1VzU1VGQlNTeFhRVUZYTEVsQlFVa3NTMEZCU3l4RFFVRkRMR0ZCUVdFc1EwRkJReXhQUVVGUExFTkJRVU1zYjBKQlFXOUNMRU5CUVVNc1EwRkJRenRCUVVOeVJTeEpRVUZKTEZWQlFWVXNTMEZCU3l4UFFVRlBMRU5CUVVNc1kwRkJZeXhEUVVGRE8wRkJRekZETEVsQlFVa3NUMEZCVHl4UlFVRlJMRTlCUVU4c1EwRkJReXhaUVVGWkxFTkJRVU03UVVGRGVFTXNTVUZCU1N4VFFVRlRMRTFCUVUwc1QwRkJUeXhEUVVGRExHTkJRV01zUTBGQlF6dEJRVU14UXl4SlFVRkpMRmxCUVZrc1IwRkJSeXhQUVVGUExFTkJRVU1zYVVKQlFXbENMRU5CUVVNN1FVRkROME1zU1VGQlNTeFhRVUZYTEVsQlFVa3NUMEZCVHl4RFFVRkRMR1ZCUVdVc1EwRkJRenM3UVVGRk0wTXNTVUZCU1N4VlFVRlZMRXRCUVVzc1NVRkJTU3hWUVVGVkxFVkJRVVU3UVVGRGJrTXNTVUZCU1N4UlFVRlJMRTlCUVU4c1ZVRkJWU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRPMEZCUTNaRUxFbEJRVWtzVDBGQlR5eFJRVUZSTEVsQlFVa3NUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJRenRCUVVNeFF5eEpRVUZKTEZOQlFWTXNUVUZCVFN4SlFVRkpMRk5CUVZNc1EwRkJReXhWUVVGVkxFTkJRVU03UVVGRE5VTXNTVUZCU1N4WlFVRlpMRWRCUVVjc1NVRkJTU3haUVVGWkxFTkJRVU1zVlVGQlZTeERRVUZET3p0QlFVVXZReXh4UlVGQmNVVTdRVUZEY2tVc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF6dEJRVU5rTEU5QlFVOHNRMEZCUXl4SlFVRkpMRVZCUVVVN1FVRkRaQ3hUUVVGVExFTkJRVU1zU1VGQlNTeEZRVUZGTzBGQlEyaENMRmxCUVZrc1EwRkJReXhKUVVGSkxFVkJRVVU3TzBGQlJXNUNMRWxCUVVrc1UwRkJVeXhIUVVGSExGZEJRVmM3U1VGRGRrSXNTVUZCU1N4VFFVRlRMRWRCUVVjc1UwRkJVeXhEUVVGRE8xRkJRM1JDTEZkQlFWY3NSVUZCUlN4VFFVRlRMRU5CUVVNc1YwRkJWeXhGUVVGRkxGRkJRVkVzUlVGQlJTeFRRVUZUTEVOQlFVTXNVVUZCVVR0UlFVTm9SU3hUUVVGVExFVkJRVVVzVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4WFFVRlhMRVZCUVVVc1RVRkJUU3hEUVVGRE8xRkJReTlETEZsQlFWa3NSVUZCUlN4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExHTkJRV01zUlVGQlJTeE5RVUZOTEVOQlFVTTdVVUZEY2tRc1owSkJRV2RDTEVWQlFVVXNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNSVUZCUlN4VlFVRlZMRU5CUVVNN1VVRkRMMFFzVlVGQlZTeEZRVUZGTEZWQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRE8wRkJReTlETEV0QlFVc3NRMEZCUXpzN1NVRkZSaXhKUVVGSkxGTkJRVk1zUjBGQlJ5eFRRVUZUTEVOQlFVTTdVVUZEZEVJc1kwRkJZeXhGUVVGRkxGTkJRVk1zUTBGQlF5eGpRVUZqTzFGQlEzaERMRmRCUVZjc1JVRkJSU3hUUVVGVExFTkJRVU1zVjBGQlZ6dFJRVU5zUXl4alFVRmpMRVZCUVVVc1QwRkJUeXhEUVVGRExHTkJRV003VVVGRGRFTXNXVUZCV1N4SlFVRkpMRk5CUVZNc1EwRkJReXhQUVVGUExFTkJRVU1zVDBGQlR5eERRVUZETEdOQlFXTXNRMEZCUXp0UlFVTjZSQ3hyUWtGQmEwSXNSVUZCUlN4UFFVRlBMRU5CUVVNc2EwSkJRV3RDTzFGQlF6bERMRmRCUVZjc1MwRkJTeXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEdOQlFXTXNSVUZCUlN4TlFVRk5MRU5CUVVNN1VVRkRka1FzWTBGQll5eEZRVUZGTEZWQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1pVRkJaU3hGUVVGRkxFMUJRVTBzUTBGQlF6dFJRVU40UkN4aFFVRmhMRWRCUVVjc1ZVRkJWU3hEUVVGRExFbEJRVWtzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJRenRSUVVOcVJDeFRRVUZUTEU5QlFVOHNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNSVUZCUlN4TlFVRk5MRU5CUVVNN1FVRkRha1VzUzBGQlN5eERRVUZET3p0SlFVVkdMRWxCUVVrc1YwRkJWeXhIUVVGSExGZEJRVmNzUTBGQlF6dFJRVU14UWl4VlFVRlZMRVZCUVVVc1UwRkJVeXhEUVVGRExGZEJRVmNzUTBGQlF5eE5RVUZOTzFGQlEzaERMRTFCUVUwc1JVRkJSU3haUVVGWkxFTkJRVU1zVFVGQlRUdFJRVU16UWl4TFFVRkxMRVZCUVVVc1dVRkJXU3hEUVVGRExFdEJRVXM3VVVGRGVrSXNUMEZCVHl4RlFVRkZMRmxCUVZrc1EwRkJReXhQUVVGUE8xRkJRemRDTEZGQlFWRXNSVUZCUlN4UFFVRlBMRU5CUVVNc1pVRkJaVHRSUVVOcVF5eE5RVUZOTEVWQlFVVXNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFVkJRVVVzVFVGQlRTeERRVUZETzFGQlF6bERMRkZCUVZFc1JVRkJSU3hWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXp0UlFVTXhReXhQUVVGUExFVkJRVVVzVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4alFVRmpMRU5CUVVNN1FVRkRhRVFzUzBGQlN5eERRVUZET3p0SlFVVkdMRXRCUVVzc1EwRkJReXhOUVVGTk8xRkJRMUlzU1VGQlNTeERRVUZETzFsQlEwUXNVMEZCVXl4RlFVRkZMRTlCUVU4c1EwRkJReXhIUVVGSE8xbEJRM1JDTEZkQlFWY3NSVUZCUlN4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExGZEJRVmNzUlVGQlJTeExRVUZMTEVOQlFVTTdXVUZEYUVRc1NVRkJTU3hGUVVGRk8yZENRVU5HTEV0QlFVc3NSVUZCUlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hQUVVGUExFVkJRVVVzVDBGQlR5eEZRVUZGTEZOQlFWTXNRMEZCUXp0blFrRkRNVU1zUzBGQlN5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RlFVRkZMRTlCUVU4c1JVRkJSU3hQUVVGUExFVkJRVVVzVTBGQlV5eERRVUZETzJkQ1FVTXhReXhQUVVGUExFVkJRVVVzUTBGQlF5eEpRVUZKTEVWQlFVVXNVMEZCVXl4RlFVRkZMRTlCUVU4c1JVRkJSU3hYUVVGWExFTkJRVU03WVVGRGJrUTdVMEZEU2l4RFFVRkRPMUZCUTBZc1VVRkJVU3hEUVVGRExHTkJRV01zUTBGQlF5eExRVUZMTEVOQlFVTTdTMEZEYWtNN1FVRkRUQ3hEUVVGRE96dEJRVVZFTEV0QlFVc3NRMEZCUXl4eFFrRkJjVUlzUTBGQlF5eEpRVUZKTEVOQlFVTTdRVUZEYWtNc1UwRkJVeXhGUVVGRk8wRkJRMWdzVDBGQlR5eERRVUZETEZGQlFWRXNRMEZCUXl4VFFVRlRMRU5CUVVNN1FVRkRNMElzVTBGQlV5eERRVUZETEZGQlFWRXNRMEZCUXl4VFFVRlRMRU5CUVVNN1FVRkROMElzV1VGQldTeERRVUZETEZGQlFWRXNRMEZCUXl4VFFVRlRMRU5CUVVNaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnVkdGaWN5QWdJQ0FnSUNBZ0lEMGdVbVZoWTNRdVkzSmxZWFJsUm1GamRHOXllU2h5WlhGMWFYSmxLQ2N1TDNSaFluTXVhbk40SnlrcFhHNTJZWElnVTJWMGRYQlFZV2RsSUNBZ0lEMGdVbVZoWTNRdVkzSmxZWFJsUm1GamRHOXllU2h5WlhGMWFYSmxLQ2N1TDNObGRIVndMWEJoWjJVdWFuTjRKeWtwWEc1MllYSWdVbTlzWlhOUVlXZGxJQ0FnSUQwZ1VtVmhZM1F1WTNKbFlYUmxSbUZqZEc5eWVTaHlaWEYxYVhKbEtDY3VMM0p2YkdWekxYQmhaMlV1YW5ONEp5a3BYRzUyWVhJZ1RXbHpjMmx2YmxCaFoyVWdJRDBnVW1WaFkzUXVZM0psWVhSbFJtRmpkRzl5ZVNoeVpYRjFhWEpsS0NjdUwyMXBjM05wYjI0dGNHRm5aUzVxYzNnbktTbGNiblpoY2lCRWFYTndZWFJqYUdWeUlDQWdQU0J5WlhGMWFYSmxLQ2N1TDJScGMzQmhkR05vWlhJbktWeHVkbUZ5SUZWSlUzUmhkR1VnSUNBZ0lDQTlJSEpsY1hWcGNtVW9KeTR2ZFdrdGMzUmhkR1VuS1Z4dWRtRnlJRWRoYldWVGRHRjBaU0FnSUNBOUlISmxjWFZwY21Vb0p5NHZaMkZ0WlMxemRHRjBaU2NwWEc1MllYSWdUV2x6YzJsdmJsTjBZWFJsSUQwZ2NtVnhkV2x5WlNnbkxpOXRhWE56YVc5dUxYTjBZWFJsSnlsY2JuWmhjaUJ6ZEc5eVpWOXlaWE5sZENBZ1BTQnlaWEYxYVhKbEtDY3VMM04wYjNKbExYSmxjMlYwSnlsY2JseHVkbUZ5SUdScGMzQmhkR05vWlhJZ0lDQTlJRzVsZHlCRWFYTndZWFJqYUdWeUtDbGNiblpoY2lCa2FYTndZWFJqYUNBZ0lDQWdQU0JrYVhOd1lYUmphR1Z5TG1ScGMzQmhkR05vTG1KcGJtUW9aR2x6Y0dGMFkyaGxjaWxjYm5aaGNpQjFhWE4wWVhSbElDQWdJQ0FnUFNCdVpYY2dWVWxUZEdGMFpTaGthWE53WVhSamFHVnlLVnh1ZG1GeUlHZGhiV1Z6ZEdGMFpTQWdJQ0E5SUc1bGR5QkhZVzFsVTNSaGRHVW9aR2x6Y0dGMFkyaGxjaWxjYm5aaGNpQnRhWE56YVc5dWMzUmhkR1VnUFNCdVpYY2dUV2x6YzJsdmJsTjBZWFJsS0dScGMzQmhkR05vWlhJcFhHNWNiaTh2SUVsdVkzSmxZWE5sSUhSb2FYTWdiblZ0WW1WeUlHRm1kR1Z5SUdWMlpYSjVJR1JoZEdGemRHOXlaU0J6WTJobGJXRWdZbkpsWVd0cGJtY2dZMmhoYm1kbExseHVjM1J2Y21WZmNtVnpaWFFvTXlsY2JuVnBjM1JoZEdVdWJHOWhaQ2dwWEc1bllXMWxjM1JoZEdVdWJHOWhaQ2dwWEc1dGFYTnphVzl1YzNSaGRHVXViRzloWkNncFhHNWNiblpoY2lCeVpXNWtaWEpCY0hBZ1BTQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ0lDQjJZWElnYzJWMGRYQlFZV2RsSUQwZ1UyVjBkWEJRWVdkbEtIdGNiaUFnSUNBZ0lDQWdjR3hoZVdWeVRtRnRaWE02SUdkaGJXVnpkR0YwWlM1d2JHRjVaWEpPWVcxbGN5d2djMlYwZEdsdVozTTZJR2RoYldWemRHRjBaUzV6WlhSMGFXNW5jeXhjYmlBZ0lDQWdJQ0FnYjI1QlpHUk9ZVzFsT2lCa2FYTndZWFJqYUdWeUxtSmhhMlVvSjJGa1pGQnNZWGxsY2ljc0lDZHVZVzFsSnlrc1hHNGdJQ0FnSUNBZ0lHOXVSR1ZzWlhSbFRtRnRaVG9nWkdsemNHRjBZMmhsY2k1aVlXdGxLQ2RrWld4bGRHVlFiR0Y1WlhJbkxDQW5ibUZ0WlNjcExGeHVJQ0FnSUNBZ0lDQnZia05vWVc1blpWTmxkSFJwYm1kek9pQmthWE53WVhSamFHVnlMbUpoYTJVb0oyTm9ZVzVuWlZObGRIUnBibWR6Snl3Z0ozTmxkSFJwYm1kekp5a3NYRzRnSUNBZ0lDQWdJRzl1VG1WM1VtOXNaWE02SUdScGMzQmhkR05vWlhJdVltRnJaU2duYm1WM1VtOXNaWE1uS1N4Y2JpQWdJQ0I5S1Z4dVhHNGdJQ0FnZG1GeUlISnZiR1Z6VUdGblpTQTlJRkp2YkdWelVHRm5aU2g3WEc0Z0lDQWdJQ0FnSUdScGMyRmliR1ZrVW1WaGMyOXVPaUJuWVcxbGMzUmhkR1V1WkdsellXSnNaV1JTWldGemIyNHNYRzRnSUNBZ0lDQWdJSEJzWVhsbGNrNWhiV1Z6T2lCbllXMWxjM1JoZEdVdWNHeGhlV1Z5VG1GdFpYTXNYRzRnSUNBZ0lDQWdJSE5sYkdWamRHVmtVR3hoZVdWeU9pQjFhWE4wWVhSbExuTmxiR1ZqZEdWa1VHeGhlV1Z5TEZ4dUlDQWdJQ0FnSUNCelpXeGxZM1JsWkZKdmJHVTZJQ0FnWjJGdFpYTjBZWFJsTG1kbGRGSnZiR1VvZFdsemRHRjBaUzV6Wld4bFkzUmxaRkJzWVhsbGNpa3NYRzRnSUNBZ0lDQWdJSE5sYkdWamRHbHZia052Ym1acGNtMWxaRG9nZFdsemRHRjBaUzV6Wld4bFkzUnBiMjVEYjI1bWFYSnRaV1FzWEc0Z0lDQWdJQ0FnSUc5dVEyeHBZMnRUYUc5M09pQWdJQ0JrYVhOd1lYUmphR1Z5TG1KaGEyVW9KM05sYkdWamRGQnNZWGxsY2ljc0lDZHVZVzFsSnlrc1hHNGdJQ0FnSUNBZ0lHOXVRMnhwWTJ0RGIyNW1hWEp0T2lCa2FYTndZWFJqYUdWeUxtSmhhMlVvSjJOdmJtWnBjbTFRYkdGNVpYSW5MQ0FuYm1GdFpTY3BMRnh1SUNBZ0lDQWdJQ0J2YmtOc2FXTnJRMkZ1WTJWc09pQWdaR2x6Y0dGMFkyaGxjaTVpWVd0bEtDZGtaWE5sYkdWamRGQnNZWGxsY2ljcExGeHVJQ0FnSUNBZ0lDQnZia05zYVdOclQyczZJQ0FnSUNBZ1pHbHpjR0YwWTJobGNpNWlZV3RsS0Nka1pYTmxiR1ZqZEZCc1lYbGxjaWNzSUNkdVlXMWxKeWtzWEc0Z0lDQWdmU2xjYmx4dUlDQWdJSFpoY2lCdGFYTnphVzl1VUdGblpTQTlJRTFwYzNOcGIyNVFZV2RsS0h0Y2JpQWdJQ0FnSUNBZ2JuVnRVR3hoZVdWeWN6b2daMkZ0WlhOMFlYUmxMbkJzWVhsbGNrNWhiV1Z6TG14bGJtZDBhQ3hjYmlBZ0lDQWdJQ0FnY0dGemMyVnpPaUJ0YVhOemFXOXVjM1JoZEdVdWNHRnpjMlZ6TEZ4dUlDQWdJQ0FnSUNCbVlXbHNjem9nYldsemMybHZibk4wWVhSbExtWmhhV3h6TEZ4dUlDQWdJQ0FnSUNCb2FYTjBiM0o1T2lCdGFYTnphVzl1YzNSaGRHVXVhR2x6ZEc5eWVTeGNiaUFnSUNBZ0lDQWdjbVYyWldGc1pXUTZJSFZwYzNSaGRHVXViV2x6YzJsdmJsSmxkbVZoYkdWa0xGeHVJQ0FnSUNBZ0lDQnZibFp2ZEdVNklHUnBjM0JoZEdOb1pYSXVZbUZyWlNnbmJXbHpjMmx2YmxadmRHVW5MQ0FuY0dGemN5Y3BMRnh1SUNBZ0lDQWdJQ0J2YmxKbGRtVmhiRG9nWkdsemNHRjBZMmhsY2k1aVlXdGxLQ2R0YVhOemFXOXVVbVYyWldGc0p5a3NYRzRnSUNBZ0lDQWdJRzl1VW1WelpYUTZJR1JwYzNCaGRHTm9aWEl1WW1GclpTZ25iV2x6YzJsdmJsSmxjMlYwSnlrc1hHNGdJQ0FnZlNsY2JseHVJQ0FnSUZKbFlXTjBMbkpsYm1SbGNpaGNiaUFnSUNBZ0lDQWdWR0ZpY3loN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JoWTNScGRtVlVZV0k2SUhWcGMzUmhkR1V1ZEdGaUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnYjI1RGFHRnVaMlZVWVdJNklHUnBjM0JoZEdOb1pYSXVZbUZyWlNnblkyaGhibWRsVkdGaUp5d2dKM1JoWWljcExGeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdGaWN6b2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE5sZEhWd09pQjdibUZ0WlRvZ0oxTmxkSFZ3Snl3Z1kyOXVkR1Z1ZERvZ2MyVjBkWEJRWVdkbGZTeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnliMnhsY3pvZ2UyNWhiV1U2SUNkU2IyeGxjeWNzSUdOdmJuUmxiblE2SUhKdmJHVnpVR0ZuWlgwc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JXbHpjMmx2YmpvZ2UyNWhiV1U2SUNkTmFYTnphVzl1Snl3Z1kyOXVkR1Z1ZERvZ2JXbHpjMmx2YmxCaFoyVjlMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlLU3hjYmlBZ0lDQWdJQ0FnWkc5amRXMWxiblF1WjJWMFJXeGxiV1Z1ZEVKNVNXUW9KMkZ3Y0NjcFhHNGdJQ0FnS1Z4dWZWeHVYRzVTWldGamRDNXBibWwwYVdGc2FYcGxWRzkxWTJoRmRtVnVkSE1vZEhKMVpTbGNibkpsYm1SbGNrRndjQ2dwWEc1MWFYTjBZWFJsTG05dVEyaGhibWRsS0hKbGJtUmxja0Z3Y0NsY2JtZGhiV1Z6ZEdGMFpTNXZia05vWVc1blpTaHlaVzVrWlhKQmNIQXBYRzV0YVhOemFXOXVjM1JoZEdVdWIyNURhR0Z1WjJVb2NtVnVaR1Z5UVhCd0tWeHVJbDE5IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBQVCA9IFJlYWN0LlByb3BUeXBlc1xuXG52YXIgTGFiZWxlZE51bWJlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgbnVtOiBQVC5udW1iZXIuaXNSZXF1aXJlZCxcbiAgICAgICAgbmFtZTogUFQuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiA8ZmlndXJlIGNsYXNzTmFtZT1cImxhYmVsZWQtbnVtYmVyXCI+XG4gICAgICAgICAgICB7dGhpcy5wcm9wcy5udW19XG4gICAgICAgICAgICA8ZmlnY2FwdGlvbj57dGhpcy5wcm9wcy5uYW1lfTwvZmlnY2FwdGlvbj5cbiAgICAgICAgPC9maWd1cmU+XG4gICAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExhYmVsZWROdW1iZXJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgTGFiZWxlZE51bWJlciA9IHJlcXVpcmUoJy4vbGFiZWxlZC1udW1iZXIuanN4JylcbnZhciBQVCA9IFJlYWN0LlByb3BUeXBlc1xudmFyIGN4ID0gY2xhc3NuYW1lc1xuXG52YXIgTWlzc2lvblBhZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG51bVBsYXllcnM6IFBULm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgICBwYXNzZXM6IFBULm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgICBmYWlsczogIFBULm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgICBoaXN0b3J5OiBQVC5hcnJheS5pc1JlcXVpcmVkLFxuICAgICAgICByZXZlYWxlZDogIFBULmJvb2wuaXNSZXF1aXJlZCxcbiAgICAgICAgb25Wb3RlOiAgUFQuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBvblJlc2V0OiAgUFQuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBvblJldmVhbDogIFBULmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1pc3Npb25OdW1iZXJzID0gdGhpcy5yZW5kZXJNaXNzaW9uTnVtYmVycygpXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnJldmVhbGVkKSB7XG4gICAgICAgICAgICB2YXIgcGFzc0xhYmVsID0gdGhpcy5wcm9wcy5wYXNzZXMgPT09IDEgPyBcIlBhc3NcIiA6IFwiUGFzc2VzXCJcbiAgICAgICAgICAgIHZhciBmYWlsTGFiZWwgPSB0aGlzLnByb3BzLmZhaWxzID09PSAxID8gXCJGYWlsXCIgOiBcIkZhaWxzXCJcblxuICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibWlzc2lvbi1wYWdlIHJldmVhbGVkXCI+XG4gICAgICAgICAgICAgICAge21pc3Npb25OdW1iZXJzfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidm90ZS1ob2xkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPExhYmVsZWROdW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9e3Bhc3NMYWJlbH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG51bT17dGhpcy5wcm9wcy5wYXNzZXN9IC8+XG4gICAgICAgICAgICAgICAgICAgIDxMYWJlbGVkTnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lPXtmYWlsTGFiZWx9XG4gICAgICAgICAgICAgICAgICAgICAgICBudW09e3RoaXMucHJvcHMuZmFpbHN9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyZXNldFwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMub25SZXNldH0gPlxuICAgICAgICAgICAgICAgICAgICBSZXNldDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdm90ZXMgPSB0aGlzLnByb3BzLnBhc3NlcyArIHRoaXMucHJvcHMuZmFpbHNcbiAgICAgICAgICAgIE1hdGgucmFuZG9tKClcbiAgICAgICAgICAgIHZhciBzaWRlID0gTWF0aC5yYW5kb20oKSA+IDAuNVxuICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibWlzc2lvbi1wYWdlXCI+XG4gICAgICAgICAgICAgICAge21pc3Npb25OdW1iZXJzfVxuICAgICAgICAgICAgICAgIDxMYWJlbGVkTnVtYmVyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU9XCJWb3Rlc1wiXG4gICAgICAgICAgICAgICAgICAgIG51bT17dm90ZXN9IC8+XG4gICAgICAgICAgICAgICAge3RoaXMucmVuZGVyVm90ZUJ1dHRvbihzaWRlKX1cbiAgICAgICAgICAgICAgICB7dGhpcy5yZW5kZXJWb3RlQnV0dG9uKCFzaWRlKX1cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJlc2V0XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5vblJlc2V0fSA+XG4gICAgICAgICAgICAgICAgICAgIFJlc2V0PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZXZlYWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwicmV2ZWFsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMub25SZXZlYWx9PlxuICAgICAgICAgICAgICAgICAgICAgICAgU2hvdyBWb3RlczwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyTWlzc2lvbk51bWJlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxheWVyQ291bnRzTWFwcGluZyA9IHtcbiAgICAgICAgICAgIDU6IFtcIjJcIiwgXCIzXCIsIFwiMlwiLCBcIjNcIiwgXCIzXCJdLFxuICAgICAgICAgICAgNjogW1wiMlwiLCBcIjNcIiwgXCI0XCIsIFwiM1wiLCBcIjRcIl0sXG4gICAgICAgICAgICA3OiBbXCIyXCIsIFwiM1wiLCBcIjNcIiwgXCI0KlwiLCBcIjRcIl0sXG4gICAgICAgICAgICA4OiBbXCIzXCIsIFwiNFwiLCBcIjRcIiwgXCI1KlwiLCBcIjVcIl0sXG4gICAgICAgICAgICA5OiBbXCIzXCIsIFwiNFwiLCBcIjRcIiwgXCI1KlwiLCBcIjVcIl0sXG4gICAgICAgICAgICAxMDogW1wiM1wiLCBcIjRcIiwgXCI0XCIsIFwiNSpcIiwgXCI1XCJdLFxuICAgICAgICB9XG4gICAgICAgIHZhciBwbGF5ZXJDb3VudHMgPSBwbGF5ZXJDb3VudHNNYXBwaW5nW3RoaXMucHJvcHMubnVtUGxheWVyc11cbiAgICAgICAgdmFyIGhpc3RvcnkgPSB0aGlzLnByb3BzLmhpc3RvcnlcblxuICAgICAgICBpZiAocGxheWVyQ291bnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGlnaXRzID0gcGxheWVyQ291bnRzLm1hcChmdW5jdGlvbihuLCBpKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVkID0gaGlzdG9yeS5sZW5ndGggPiBpXG4gICAgICAgICAgICB2YXIgcGFzc2VkID0gaGlzdG9yeVtpXT09MCB8fCAoaGlzdG9yeVtpXT09MSAmJiBwbGF5ZXJDb3VudHNbaV0uaW5kZXhPZihcIipcIikhPS0xKVxuICAgICAgICAgICAgcmV0dXJuIDxzcGFuIGtleT17aX0gY2xhc3NOYW1lPXtjeCh7XG4gICAgICAgICAgICAgICAgJ3Bhc3MnOiBwbGF5ZWQgJiYgcGFzc2VkLFxuICAgICAgICAgICAgICAgICdmYWlsJzogcGxheWVkICYmICFwYXNzZWQsXG4gICAgICAgICAgICAgICAgJ2N1cnJlbnQnOiBoaXN0b3J5Lmxlbmd0aCA9PT1pLFxuICAgICAgICAgICAgICAgICdudW0nOiB0cnVlLFxuICAgICAgICAgICAgfSl9PntwbGF5ZXJDb3VudHNbaV19PC9zcGFuPlxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm1pc3Npb24tbnVtYmVyc1wiPlxuICAgICAgICAgICAge2RpZ2l0c31cbiAgICAgICAgPC9kaXY+XG4gICAgfSxcblxuICAgIHJlbmRlclZvdGVCdXR0b246IGZ1bmN0aW9uKHBhc3MpIHtcbiAgICAgICAgdmFyIGxhYmVsID0gcGFzcyA/IFwiUGFzc1wiIDogXCJGYWlsXCJcbiAgICAgICAgcmV0dXJuIDxkaXYga2V5PXtsYWJlbH0gY2xhc3NOYW1lPVwidm90ZS1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2N4KHtcbiAgICAgICAgICAgICAgICAgICAgJ3Bhc3MnOiBwYXNzLFxuICAgICAgICAgICAgICAgICAgICAnZmFpbCc6ICFwYXNzLFxuICAgICAgICAgICAgICAgICAgICAnc2VjcmV0LWZvY3VzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICBkYXRhLXBhc3M9e3Bhc3N9XG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblZvdGV9ID5cbiAgICAgICAgICAgICAgICB7bGFiZWx9PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgIH0sXG5cbiAgICBvblZvdGU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHBhc3MgPSBlLnRhcmdldC5kYXRhc2V0LnBhc3MgPT09IFwidHJ1ZVwiXG4gICAgICAgIHRoaXMucHJvcHMub25Wb3RlKHBhc3MpXG4gICAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1pc3Npb25QYWdlXG4iLCJ2YXIgU3RvcmUgPSByZXF1aXJlKCcuL3N0b3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBNaXNzaW9uU3RhdGVcblxuZnVuY3Rpb24gTWlzc2lvblN0YXRlKGRpc3BhdGNoZXIpIHtcbiAgICBTdG9yZS5taXhpbih0aGlzKVxuXG4gICAgdGhpcy5wYXNzZXMgPSAwXG4gICAgdGhpcy5mYWlscyA9IDBcbiAgICB0aGlzLmhpc3RvcnkgPSBbXVxuXG4gICAgZGlzcGF0Y2hlci5vbkFjdGlvbihmdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgICAgIHZhciBhY3Rpb25zID0gTWlzc2lvblN0YXRlLmFjdGlvbnNcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihhY3Rpb25zW3BheWxvYWQuYWN0aW9uXSkpIHtcbiAgICAgICAgICAgIGFjdGlvbnNbcGF5bG9hZC5hY3Rpb25dLmNhbGwodGhpcywgcGF5bG9hZClcbiAgICAgICAgICAgIHRoaXMuc2F2ZSgpXG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpXG59XG5cbnZhciBQRVJTSVNUX0tFWVMgPSBbJ3Bhc3NlcycsICdmYWlscycsICdoaXN0b3J5J11cblxuTWlzc2lvblN0YXRlLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBlcnNpc3QgPSB7fVxuICAgIFBFUlNJU1RfS0VZUy5mb3JFYWNoKGtleSA9PiBwZXJzaXN0W2tleV0gPSB0aGlzW2tleV0pXG4gICAgc3RvcmUuc2V0KCdzdG9yZS5taXNzaW9uc3RhdGUnLCBwZXJzaXN0KVxufVxuXG5NaXNzaW9uU3RhdGUucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGVyc2lzdCA9IHN0b3JlLmdldCgnc3RvcmUubWlzc2lvbnN0YXRlJylcbiAgICBpZiAocGVyc2lzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFBFUlNJU1RfS0VZUy5mb3JFYWNoKGtleSA9PiB0aGlzW2tleV0gPSBwZXJzaXN0W2tleV0pXG4gICAgfVxufVxuXG5NaXNzaW9uU3RhdGUucHJvdG90eXBlLnJlc2V0TWlzc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucGFzc2VzID0gMFxuICAgIHRoaXMuZmFpbHMgPSAwXG4gICAgdGhpcy5lbWl0Q2hhbmdlKClcbn1cblxuTWlzc2lvblN0YXRlLnByb3RvdHlwZS5yZXNldE1pc3Npb25IaXN0b3J5ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oaXN0b3J5ID0gW11cbiAgICB0aGlzLnJlc2V0TWlzc2lvbigpXG59XG5cbk1pc3Npb25TdGF0ZS5hY3Rpb25zID0ge31cblxuTWlzc2lvblN0YXRlLmFjdGlvbnMubWlzc2lvblZvdGUgPSBmdW5jdGlvbih7cGFzc30pIHtcbiAgICBpZiAocGFzcykge1xuICAgICAgICB0aGlzLnBhc3NlcyArPSAxXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5mYWlscyArPSAxXG4gICAgfVxuICAgIHRoaXMuZW1pdENoYW5nZSgpXG59XG5cbk1pc3Npb25TdGF0ZS5hY3Rpb25zLm1pc3Npb25SZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVzZXRNaXNzaW9uKClcbn1cblxuTWlzc2lvblN0YXRlLmFjdGlvbnMuYWRkUGxheWVyID0gZnVuY3Rpb24oe25hbWV9KSB7XG4gICAgdGhpcy5yZXNldE1pc3Npb25IaXN0b3J5KClcbn1cblxuTWlzc2lvblN0YXRlLmFjdGlvbnMuZGVsZXRlUGxheWVyID0gZnVuY3Rpb24oe25hbWV9KSB7XG4gICAgdGhpcy5yZXNldE1pc3Npb25IaXN0b3J5KClcbn1cblxuTWlzc2lvblN0YXRlLmFjdGlvbnMuY2hhbmdlU2V0dGluZ3MgPSBmdW5jdGlvbih7c2V0dGluZ3N9KSB7XG4gICAgdGhpcy5yZXNldE1pc3Npb25IaXN0b3J5KClcbn1cblxuTWlzc2lvblN0YXRlLmFjdGlvbnMubmV3Um9sZXMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlc2V0TWlzc2lvbkhpc3RvcnkoKVxufVxuXG5NaXNzaW9uU3RhdGUuYWN0aW9ucy5taXNzaW9uUmV2ZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oaXN0b3J5LnB1c2godGhpcy5mYWlscylcbn1cblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pTDJodmJXVXZiV2xzWlhNdlkyOWtaUzl5WldGamRHRnVZMlV2YzJOeWFYQjBjeTl0YVhOemFXOXVMWE4wWVhSbExtcHpJaXdpYzI5MWNtTmxjeUk2V3lJdmFHOXRaUzl0YVd4bGN5OWpiMlJsTDNKbFlXTjBZVzVqWlM5elkzSnBjSFJ6TDIxcGMzTnBiMjR0YzNSaGRHVXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJa0ZCUVVFc1NVRkJTU3hMUVVGTExFZEJRVWNzVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXpzN1FVRkZPVUlzVFVGQlRTeERRVUZETEU5QlFVOHNSMEZCUnl4WlFVRlpPenRCUVVVM1FpeFRRVUZUTEZsQlFWa3NRMEZCUXl4VlFVRlZMRVZCUVVVN1FVRkRiRU1zU1VGQlNTeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJRenM3U1VGRmFrSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRE8wbEJRMllzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RFFVRkRPMEZCUTJ4Q0xFbEJRVWtzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4RlFVRkZPenRKUVVWcVFpeFZRVUZWTEVOQlFVTXNVVUZCVVN4RFFVRkRMRk5CUVZNc1QwRkJUeXhGUVVGRk8xRkJRMnhETEVsQlFVa3NUMEZCVHl4SFFVRkhMRmxCUVZrc1EwRkJReXhQUVVGUE8xRkJRMnhETEVsQlFVa3NRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhQUVVGUExFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVN1dVRkRka01zVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEU5QlFVOHNRMEZCUXp0WlFVTXpReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTzFOQlEyUTdTMEZEU2l4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dEJRVU5xUWl4RFFVRkRPenRCUVVWRUxFbEJRVWtzV1VGQldTeEhRVUZITEVOQlFVTXNVVUZCVVN4RlFVRkZMRTlCUVU4c1JVRkJSU3hUUVVGVExFTkJRVU03TzBGQlJXcEVMRmxCUVZrc1EwRkJReXhUUVVGVExFTkJRVU1zU1VGQlNTeEhRVUZITEZkQlFWYzdTVUZEY2tNc1NVRkJTU3hQUVVGUExFZEJRVWNzUlVGQlJUdEpRVU5vUWl4WlFVRlpMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlEzSkVMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zYjBKQlFXOUNMRVZCUVVVc1QwRkJUeXhEUVVGRE8wRkJRelZETEVOQlFVTTdPMEZCUlVRc1dVRkJXU3hEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVkQlFVY3NWMEZCVnp0SlFVTnlReXhKUVVGSkxFOUJRVThzUjBGQlJ5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRzlDUVVGdlFpeERRVUZETzBsQlF6ZERMRWxCUVVrc1QwRkJUeXhMUVVGTExGTkJRVk1zUlVGQlJUdFJRVU4yUWl4WlFVRlpMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzB0QlEzaEVPMEZCUTB3c1EwRkJRenM3UVVGRlJDeFpRVUZaTEVOQlFVTXNVMEZCVXl4RFFVRkRMRmxCUVZrc1IwRkJSeXhYUVVGWE8wbEJRemRETEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJRenRKUVVObUxFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NRMEZCUXp0SlFVTmtMRWxCUVVrc1EwRkJReXhWUVVGVkxFVkJRVVU3UVVGRGNrSXNRMEZCUXpzN1FVRkZSQ3haUVVGWkxFTkJRVU1zVTBGQlV5eERRVUZETEcxQ1FVRnRRaXhIUVVGSExGZEJRVmM3U1VGRGNFUXNTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhGUVVGRk8wbEJRMnBDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRVZCUVVVN1FVRkRka0lzUTBGQlF6czdRVUZGUkN4WlFVRlpMRU5CUVVNc1QwRkJUeXhIUVVGSExFVkJRVVU3TzBGQlJYcENMRmxCUVZrc1EwRkJReXhQUVVGUExFTkJRVU1zVjBGQlZ5eEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSVHRKUVVOb1JDeEpRVUZKTEVsQlFVa3NSVUZCUlR0UlFVTk9MRWxCUVVrc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF6dExRVU51UWl4TlFVRk5PMUZCUTBnc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETzB0QlEyeENPMGxCUTBRc1NVRkJTU3hEUVVGRExGVkJRVlVzUlVGQlJUdEJRVU55UWl4RFFVRkRPenRCUVVWRUxGbEJRVmtzUTBGQlF5eFBRVUZQTEVOQlFVTXNXVUZCV1N4SFFVRkhMRmRCUVZjN1NVRkRNME1zU1VGQlNTeERRVUZETEZsQlFWa3NSVUZCUlR0QlFVTjJRaXhEUVVGRE96dEJRVVZFTEZsQlFWa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1UwRkJVeXhIUVVGSExGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0SlFVTTVReXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN1FVRkRPVUlzUTBGQlF6czdRVUZGUkN4WlFVRlpMRU5CUVVNc1QwRkJUeXhEUVVGRExGbEJRVmtzUjBGQlJ5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1NVRkRha1FzU1VGQlNTeERRVUZETEcxQ1FVRnRRaXhGUVVGRk8wRkJRemxDTEVOQlFVTTdPMEZCUlVRc1dVRkJXU3hEUVVGRExFOUJRVThzUTBGQlF5eGpRVUZqTEVkQlFVY3NVMEZCVXl4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVGRk8wbEJRM1pFTEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUlVGQlJUdEJRVU01UWl4RFFVRkRPenRCUVVWRUxGbEJRVmtzUTBGQlF5eFBRVUZQTEVOQlFVTXNVVUZCVVN4SFFVRkhMRmRCUVZjN1NVRkRka01zU1VGQlNTeERRVUZETEcxQ1FVRnRRaXhGUVVGRk8wRkJRemxDTEVOQlFVTTdPMEZCUlVRc1dVRkJXU3hEUVVGRExFOUJRVThzUTBGQlF5eGhRVUZoTEVkQlFVY3NWMEZCVnp0SlFVTTFReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8wTkJRMmhESWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaWRtRnlJRk4wYjNKbElEMGdjbVZ4ZFdseVpTZ25MaTl6ZEc5eVpTY3BYRzVjYm0xdlpIVnNaUzVsZUhCdmNuUnpJRDBnVFdsemMybHZibE4wWVhSbFhHNWNibVoxYm1OMGFXOXVJRTFwYzNOcGIyNVRkR0YwWlNoa2FYTndZWFJqYUdWeUtTQjdYRzRnSUNBZ1UzUnZjbVV1YldsNGFXNG9kR2hwY3lsY2JseHVJQ0FnSUhSb2FYTXVjR0Z6YzJWeklEMGdNRnh1SUNBZ0lIUm9hWE11Wm1GcGJITWdQU0F3WEc0Z0lDQWdkR2hwY3k1b2FYTjBiM0o1SUQwZ1cxMWNibHh1SUNBZ0lHUnBjM0JoZEdOb1pYSXViMjVCWTNScGIyNG9ablZ1WTNScGIyNG9jR0Y1Ykc5aFpDa2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ1lXTjBhVzl1Y3lBOUlFMXBjM05wYjI1VGRHRjBaUzVoWTNScGIyNXpYRzRnSUNBZ0lDQWdJR2xtSUNoZkxtbHpSblZ1WTNScGIyNG9ZV04wYVc5dWMxdHdZWGxzYjJGa0xtRmpkR2x2YmwwcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCaFkzUnBiMjV6VzNCaGVXeHZZV1F1WVdOMGFXOXVYUzVqWVd4c0tIUm9hWE1zSUhCaGVXeHZZV1FwWEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5OaGRtVW9LVnh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmUzVpYVc1a0tIUm9hWE1wS1Z4dWZWeHVYRzUyWVhJZ1VFVlNVMGxUVkY5TFJWbFRJRDBnV3lkd1lYTnpaWE1uTENBblptRnBiSE1uTENBbmFHbHpkRzl5ZVNkZFhHNWNiazFwYzNOcGIyNVRkR0YwWlM1d2NtOTBiM1I1Y0dVdWMyRjJaU0E5SUdaMWJtTjBhVzl1S0NrZ2UxeHVJQ0FnSUhaaGNpQndaWEp6YVhOMElEMGdlMzFjYmlBZ0lDQlFSVkpUU1ZOVVgwdEZXVk11Wm05eVJXRmphQ2hyWlhrZ1BUNGdjR1Z5YzJsemRGdHJaWGxkSUQwZ2RHaHBjMXRyWlhsZEtWeHVJQ0FnSUhOMGIzSmxMbk5sZENnbmMzUnZjbVV1YldsemMybHZibk4wWVhSbEp5d2djR1Z5YzJsemRDbGNibjFjYmx4dVRXbHpjMmx2YmxOMFlYUmxMbkJ5YjNSdmRIbHdaUzVzYjJGa0lEMGdablZ1WTNScGIyNG9LU0I3WEc0Z0lDQWdkbUZ5SUhCbGNuTnBjM1FnUFNCemRHOXlaUzVuWlhRb0ozTjBiM0psTG0xcGMzTnBiMjV6ZEdGMFpTY3BYRzRnSUNBZ2FXWWdLSEJsY25OcGMzUWdJVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVJQ0FnSUNBZ0lDQlFSVkpUU1ZOVVgwdEZXVk11Wm05eVJXRmphQ2hyWlhrZ1BUNGdkR2hwYzF0clpYbGRJRDBnY0dWeWMybHpkRnRyWlhsZEtWeHVJQ0FnSUgxY2JuMWNibHh1VFdsemMybHZibE4wWVhSbExuQnliM1J2ZEhsd1pTNXlaWE5sZEUxcGMzTnBiMjRnUFNCbWRXNWpkR2x2YmlncElIdGNiaUFnSUNCMGFHbHpMbkJoYzNObGN5QTlJREJjYmlBZ0lDQjBhR2x6TG1aaGFXeHpJRDBnTUZ4dUlDQWdJSFJvYVhNdVpXMXBkRU5vWVc1blpTZ3BYRzU5WEc1Y2JrMXBjM05wYjI1VGRHRjBaUzV3Y205MGIzUjVjR1V1Y21WelpYUk5hWE56YVc5dVNHbHpkRzl5ZVNBOUlHWjFibU4wYVc5dUtDa2dlMXh1SUNBZ0lIUm9hWE11YUdsemRHOXllU0E5SUZ0ZFhHNGdJQ0FnZEdocGN5NXlaWE5sZEUxcGMzTnBiMjRvS1Z4dWZWeHVYRzVOYVhOemFXOXVVM1JoZEdVdVlXTjBhVzl1Y3lBOUlIdDlYRzVjYmsxcGMzTnBiMjVUZEdGMFpTNWhZM1JwYjI1ekxtMXBjM05wYjI1V2IzUmxJRDBnWm5WdVkzUnBiMjRvZTNCaGMzTjlLU0I3WEc0Z0lDQWdhV1lnS0hCaGMzTXBJSHRjYmlBZ0lDQWdJQ0FnZEdocGN5NXdZWE56WlhNZ0t6MGdNVnh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Wm1GcGJITWdLejBnTVZ4dUlDQWdJSDFjYmlBZ0lDQjBhR2x6TG1WdGFYUkRhR0Z1WjJVb0tWeHVmVnh1WEc1TmFYTnphVzl1VTNSaGRHVXVZV04wYVc5dWN5NXRhWE56YVc5dVVtVnpaWFFnUFNCbWRXNWpkR2x2YmlncElIdGNiaUFnSUNCMGFHbHpMbkpsYzJWMFRXbHpjMmx2YmlncFhHNTlYRzVjYmsxcGMzTnBiMjVUZEdGMFpTNWhZM1JwYjI1ekxtRmtaRkJzWVhsbGNpQTlJR1oxYm1OMGFXOXVLSHR1WVcxbGZTa2dlMXh1SUNBZ0lIUm9hWE11Y21WelpYUk5hWE56YVc5dVNHbHpkRzl5ZVNncFhHNTlYRzVjYmsxcGMzTnBiMjVUZEdGMFpTNWhZM1JwYjI1ekxtUmxiR1YwWlZCc1lYbGxjaUE5SUdaMWJtTjBhVzl1S0h0dVlXMWxmU2tnZTF4dUlDQWdJSFJvYVhNdWNtVnpaWFJOYVhOemFXOXVTR2x6ZEc5eWVTZ3BYRzU5WEc1Y2JrMXBjM05wYjI1VGRHRjBaUzVoWTNScGIyNXpMbU5vWVc1blpWTmxkSFJwYm1keklEMGdablZ1WTNScGIyNG9lM05sZEhScGJtZHpmU2tnZTF4dUlDQWdJSFJvYVhNdWNtVnpaWFJOYVhOemFXOXVTR2x6ZEc5eWVTZ3BYRzU5WEc1Y2JrMXBjM05wYjI1VGRHRjBaUzVoWTNScGIyNXpMbTVsZDFKdmJHVnpJRDBnWm5WdVkzUnBiMjRvS1NCN1hHNGdJQ0FnZEdocGN5NXlaWE5sZEUxcGMzTnBiMjVJYVhOMGIzSjVLQ2xjYm4xY2JseHVUV2x6YzJsdmJsTjBZWFJsTG1GamRHbHZibk11YldsemMybHZibEpsZG1WaGJDQTlJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJSFJvYVhNdWFHbHpkRzl5ZVM1d2RYTm9LSFJvYVhNdVptRnBiSE1wWEc1OVhHNGlYWDA9IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBjb2xvclN0eWxlRm9yUGxheWVyID0gcmVxdWlyZSgnLi9jb2xvci5qcycpXG52YXIgUFQgPSBSZWFjdC5Qcm9wVHlwZXNcbnZhciBjeCA9IGNsYXNzbmFtZXNcblxudmFyIE5hbWVsZXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG5hbWU6IFBULnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbmFtZSA9IHRoaXMucHJvcHMubmFtZVxuICAgICAgICB2YXIgc3R5bGVzID0geyduYW1lbGV0JzogdHJ1ZX1cbiAgICAgICAgaWYgKHRoaXMucHJvcHMubmFtZSAhPT0gXCJcIikge1xuICAgICAgICAgICAgc3R5bGVzW2NvbG9yU3R5bGVGb3JQbGF5ZXIobmFtZSldID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT17Y3goc3R5bGVzKX0+e25hbWVbMF19PC9kaXY+XG4gICAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmFtZWxldFxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBOYW1lbGV0ID0gcmVxdWlyZSgnLi9uYW1lbGV0LmpzeCcpXG52YXIgUFQgPSBSZWFjdC5Qcm9wVHlwZXNcblxudmFyIE5ld05hbWUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG9uQWRkTmFtZTogUFQuZnVuYyxcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHt0ZXh0OiAnJ31cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIDxmb3JtIGNsYXNzTmFtZT1cIm5ldy1wbGF5ZXJcIiBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0+XG4gICAgICAgICAgICA8TmFtZWxldCBuYW1lPXt0aGlzLnN0YXRlLnRleHR9IC8+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cIm5hbWVcIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm5hbWVcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLnRleHR9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJBbm90aGVyIFBsYXllclwiXG4gICAgICAgICAgICAgICAgYXV0b0NhcGl0YWxpemU9XCJvblwiXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25DaGFuZ2V9XG4gICAgICAgICAgICAgICAgPjwvaW5wdXQ+XG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cIm5ldy1wbGF5ZXJcIj5cbiAgICAgICAgICAgICAgICBBZGQ8L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuICAgIH0sXG5cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgbmFtZSA9IGUudGFyZ2V0LnZhbHVlXG4gICAgICAgIG5hbWUgPSBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKSxcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGV4dDogbmFtZX0pXG4gICAgfSxcblxuICAgIG9uU3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiAodGhpcy5zdGF0ZS50ZXh0ICE9IFwiXCIpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25BZGROYW1lKHRoaXMuc3RhdGUudGV4dClcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3RleHQ6IFwiXCJ9KVxuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmV3TmFtZVxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBOYW1lbGV0ID0gcmVxdWlyZSgnLi9uYW1lbGV0LmpzeCcpXG52YXIgUFQgPSBSZWFjdC5Qcm9wVHlwZXNcblxudmFyIFBsYXllckNoaXAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG5hbWU6IFBULnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJwbGF5ZXItY2hpcFwiPlxuICAgICAgICAgICAgPE5hbWVsZXQgbmFtZT17dGhpcy5wcm9wcy5uYW1lfSAvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibmFtZVwiPnt0aGlzLnByb3BzLm5hbWV9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyQ2hpcFxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBQVCA9IFJlYWN0LlByb3BUeXBlc1xuXG52YXIgUm9sZUNhcmQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHBsYXllck5hbWU6IFBULnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICByb2xlOiBQVC5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJvbGUgPSB0aGlzLnByb3BzLnJvbGVcbiAgICAgICAgdmFyIGNvbnRlbnRzID0gbnVsbFxuXG4gICAgICAgIHZhciB0aGVTcGllcyA9IHJvbGUuc3BpZXMgfHwgcm9sZS5vdGhlclNwaWVzIHx8IFtdO1xuICAgICAgICB2YXIgc3BpZXNUZXh0ID0gdGhlU3BpZXMuam9pbignLCAnKVxuICAgICAgICB2YXIgc3B5Tm91biA9IHRoZVNwaWVzLmxlbmd0aCA9PSAxID8gXCJzcHlcIiA6IFwic3BpZXNcIlxuICAgICAgICB2YXIgc3B5VmVyYiA9IHRoZVNwaWVzLmxlbmd0aCA9PSAxID8gXCJpc1wiIDogXCJhcmVcIlxuICAgICAgICB2YXIgb3RoZXIgPSByb2xlLnNweT8gXCJvdGhlclwiIDogXCJcIlxuICAgICAgICB2YXIgb2Jlcm9uVGV4dCA9IHJvbGUuaGFzT2Jlcm9uPyA8c3Bhbj48YnIgLz48c3BhbiBjbGFzc05hbWU9J3NweSc+T2Jlcm9uPC9zcGFuPiBpcyBoaWRkZW4gZnJvbSB5b3UuPC9zcGFuPiA6ICcnXG4gICAgICAgIHZhciBzcGllc0Jsb2NrID0gdGhlU3BpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gPHA+VGhlIHtvdGhlcn0ge3NweU5vdW59IHtzcHlWZXJifSA8c3BhbiBjbGFzc05hbWU9J3NweSc+e3NwaWVzVGV4dH08L3NwYW4+LiB7b2Jlcm9uVGV4dH08L3A+XG4gICAgICAgICAgICAgICAgOiA8cD5Zb3UgZG8gbm90IHNlZSBhbnkge290aGVyfSBzcGllcy48L3A+XG4gICAgICAgIHZhciBleHRyYUluZm8gPSA8ZGl2PjwvZGl2PlxuICAgICAgICB2YXIgZGVzY3JpcHRpb24gPSA8cD48L3A+XG5cbiAgICAgICAgdmFyIG5hbWUgPSA8c3BhbiBjbGFzc05hbWU9J3Jlc2lzdGFuY2UnPnJlc2lzdGFuY2U8L3NwYW4+XG5cbiAgICAgICAgaWYgKHJvbGUuc3B5ICYmICFyb2xlLm9iZXJvbikge1xuICAgICAgICAgICAgbmFtZSA9IDxzcGFuPmEgPHNwYW4gY2xhc3NOYW1lPSdzcHknPnNweTwvc3Bhbj48L3NwYW4+O1xuICAgICAgICAgICAgZXh0cmFJbmZvID0gc3BpZXNCbG9jaztcbiAgICAgICAgfVxuICAgICAgICBpZiAocm9sZS5wZXJjaXZhbCkge1xuICAgICAgICAgICAgbmFtZSA9IDxzcGFuIGNsYXNzTmFtZT0ncmVzaXN0YW5jZSc+UGVyY2l2YWw8L3NwYW4+XG4gICAgICAgICAgICB2YXIgdGhlTWVybGlucyA9IHJvbGUubWVybGlucztcbiAgICAgICAgICAgIHZhciBtZXJsaW5zVGV4dCA9IHRoZU1lcmxpbnMuam9pbignLCAnKTtcbiAgICAgICAgICAgIHZhciBtZXJsaW5Ob3VuID0gdGhlTWVybGlucy5sZW5ndGggPT0gMSA/ICdNZXJsaW4nIDogJ01lcmxpbnMnO1xuICAgICAgICAgICAgdmFyIG1lcmxpblZlcmIgPSB0aGVNZXJsaW5zLmxlbmd0aCA9PSAxID8gJ2lzJyA6ICdhcmUnO1xuICAgICAgICAgICAgdmFyIG1lcmxpbnNCbG9jayA9IDxwPlRoZSB7bWVybGluTm91bn0ge21lcmxpblZlcmJ9OiB7bWVybGluc1RleHR9PC9wPlxuICAgICAgICAgICAgZXh0cmFJbmZvID0gbWVybGluc0Jsb2NrO1xuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSA8cD5Zb3Ugc2VlIDxzcGFuIGNsYXNzTmFtZT0ncmVzaXN0YW5jZSc+TWVybGluPC9zcGFuPiBhbmQgPHNwYW4gY2xhc3NOYW1lPSdzcHknPk1vcmdhbmE8L3NwYW4+IGJvdGggYXMgTWVybGluLjwvcD5cbiAgICAgICAgfVxuICAgICAgICBpZiAocm9sZS5tZXJsaW4pIHtcbiAgICAgICAgICAgIG5hbWUgPSA8c3BhbiBjbGFzc05hbWU9J3Jlc2lzdGFuY2UnPk1lcmxpbjwvc3Bhbj47XG4gICAgICAgICAgICBleHRyYUluZm8gPSBzcGllc0Jsb2NrO1xuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSA8cD5JZiB0aGUgc3BpZXMgZGlzY292ZXIgeW91ciBpZGVudGl0eSwgcmVzaXN0YW5jZSBsb3NlcyE8L3A+XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJvbGUubW9yZHJlZCkge1xuICAgICAgICAgICAgbmFtZSA9IDxzcGFuIGNsYXNzTmFtZT0nc3B5Jz5Nb3JkcmVkPC9zcGFuPlxuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSA8cD5Zb3UgYXJlIGludmlzaWJsZSB0byA8c3BhbiBjbGFzc05hbWU9J3Jlc2lzdGFuY2UnPk1lcmxpbjwvc3Bhbj4uPC9wPlxuICAgICAgICB9XG4gICAgICAgIGlmIChyb2xlLm1vcmdhbmEpIHtcbiAgICAgICAgICAgIG5hbWUgPSA8c3BhbiBjbGFzc05hbWU9J3NweSc+TW9yZ2FuYTwvc3Bhbj5cbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gPHA+WW91IGFwcGVhciBhcyA8c3BhbiBjbGFzc05hbWU9J3Jlc2lzdGFuY2UnPk1lcmxpbjwvc3Bhbj4gdG8gPHNwYW4gY2xhc3NOYW1lPSdyZXNpc3RhbmNlJz5QZXJjaXZhbDwvc3Bhbj4uPC9wPlxuICAgICAgICB9XG4gICAgICAgIGlmIChyb2xlLm9iZXJvbikge1xuICAgICAgICAgICAgbmFtZSA9IDxzcGFuIGNsYXNzTmFtZT0nc3B5Jz5PYmVyb248L3NwYW4+XG4gICAgICAgICAgICBkZXNjcmlwdGlvbiA9IDxwPlRoZSBvdGhlciBzcGllcyBjYW5ub3Qgc2VlIHlvdSwgYW5kIHlvdSBjYW5ub3Qgc2VlIHRoZW0uPC9wPlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwicm9sZS1jYXJkXCI+XG4gICAgICAgICAgICA8cD5Zb3UgYXJlIHtuYW1lfSE8L3A+XG4gICAgICAgICAgICB7ZXh0cmFJbmZvfVxuICAgICAgICAgICAge2Rlc2NyaXB0aW9ufVxuICAgICAgICA8L2Rpdj5cblxuICAgIH0sXG5cbn0pO1xuXG52YXIgSWYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIGNvbmQ6IFBULmJvb2wuaXNSZXF1aXJlZCxcbiAgICAgICAgYTogUFQuZWxlbWVudC5pc1JlcXVpcmVkLFxuICAgICAgICBiOiBQVC5lbGVtZW50LmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmNvbmQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLmFcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLmJcbiAgICAgICAgfVxuICAgIH0sXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvbGVDYXJkXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFBsYXllckNoaXAgPSByZXF1aXJlKCcuL3BsYXllci1jaGlwLmpzeCcpXG52YXIgUFQgPSBSZWFjdC5Qcm9wVHlwZXNcblxudmFyIFJvbGVQbGF5ZXJFbnRyeSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgbmFtZTogUFQuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIGNvbmZpcm1lZDogUFQuYm9vbC5pc1JlcXVpcmVkLFxuICAgICAgICBzZWxlY3RlZDogUFQuYm9vbC5pc1JlcXVpcmVkLFxuICAgICAgICBjb250ZW50OiBQVC5lbGVtZW50LFxuXG4gICAgICAgIG9uQ2xpY2tTaG93OiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQ2xpY2tDb25maXJtOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQ2xpY2tCYWNrOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiA8bGkga2V5PXt0aGlzLnByb3BzLm5hbWV9PlxuICAgICAgICAgICAgPFBsYXllckNoaXAgbmFtZT17dGhpcy5wcm9wcy5uYW1lfSAvPlxuICAgICAgICAgICAge3RoaXMucmVuZGVyQnV0dG9uKCl9XG4gICAgICAgICAgICB7dGhpcy5wcm9wcy5jb250ZW50fVxuICAgICAgICA8L2xpPlxuICAgIH0sXG5cbiAgICByZW5kZXJCdXR0b246IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBjbGlja0hhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DbGlja1Nob3codGhpcy5wcm9wcy5uYW1lKVxuICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgIHZhciB0ZXh0ID0gXCJTaG93IHJvbGVcIjtcblxuICAgICAgICBpZih0aGlzLnByb3BzLmNvbmZpcm1lZCkge1xuICAgICAgICAgICAgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrQmFjaygpXG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0ZXh0ID0gXCJIaWRlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5wcm9wcy5zZWxlY3RlZCkge1xuICAgICAgICAgICAgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrQ29uZmlybSh0aGlzLnByb3BzLm5hbWUpXG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0ZXh0ID0gXCJBcmUgeW91IFwiICsgdGhpcy5wcm9wcy5uYW1lICsgXCI/XCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gPGJ1dHRvbiBvbkNsaWNrPXtjbGlja0hhbmRsZXJ9Pnt0ZXh0fTwvYnV0dG9uPlxuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm9sZVBsYXllckVudHJ5XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJvbGVQbGF5ZXJFbnRyeSA9IHJlcXVpcmUoJy4vcm9sZS1wbGF5ZXItZW50cnkuanN4JylcbnZhciBSb2xlQ2FyZCA9IHJlcXVpcmUoJy4vcm9sZS1jYXJkLmpzeCcpXG52YXIgUFQgPSBSZWFjdC5Qcm9wVHlwZXNcblxudmFyIFJvbGVzUGFnZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgZGlzYWJsZWRSZWFzb246IFBULm9uZU9mKFsndG9vRmV3JywgJ3Rvb01hbnknXSksXG4gICAgICAgIHBsYXllck5hbWVzOiBQVC5hcnJheS5pc1JlcXVpcmVkLFxuICAgICAgICBzZWxlY3RlZFBsYXllcjogUFQuc3RyaW5nLFxuICAgICAgICBzZWxlY3RlZFJvbGU6IFBULm9iamVjdCxcbiAgICAgICAgc2VsZWN0aW9uQ29uZmlybWVkOiBQVC5ib29sLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQ2xpY2tTaG93OiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQ2xpY2tDb25maXJtOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQ2xpY2tDYW5jZWw6IFBULmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgb25DbGlja09rOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmRpc2FibGVkUmVhc29uICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgICAgICB0b29GZXc6IFwiTm90IGVub3VnaCBwbGF5ZXJzLiA6KFwiLFxuICAgICAgICAgICAgICAgIHRvb01hbnk6IFwiVG9vIG1hbnkgcGxheWVycy4gOihcIixcbiAgICAgICAgICAgIH1bdGhpcy5wcm9wcy5kaXNhYmxlZFJlYXNvbl1cbiAgICAgICAgICAgIHJldHVybiA8cD57bWVzc2FnZX08L3A+XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZWxlbWVudHMgPSB0aGlzLnByb3BzLnBsYXllck5hbWVzLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJFbnRyeShcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuc2VsZWN0ZWRQbGF5ZXIgPT09IG5hbWUsXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5zZWxlY3Rpb25Db25maXJtZWQpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICByZXR1cm4gPHVsIGNsYXNzTmFtZT1cInBsYXllci1saXN0XCI+XG4gICAgICAgICAgICB7ZWxlbWVudHN9XG4gICAgICAgIDwvdWw+XG4gICAgfSxcblxuICAgIHJlbmRlckVudHJ5OiBmdW5jdGlvbihuYW1lLCBzZWxlY3RlZCwgY29uZmlybWVkKSB7XG5cbiAgICAgICAgdmFyIGNvbnRlbnQgPSBudWxsO1xuICAgICAgICBpZiAoc2VsZWN0ZWQgJiYgY29uZmlybWVkKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gPFJvbGVDYXJkXG4gICAgICAgICAgICAgICAgcGxheWVyTmFtZT17dGhpcy5wcm9wcy5zZWxlY3RlZFBsYXllcn1cbiAgICAgICAgICAgICAgICByb2xlPXt0aGlzLnByb3BzLnNlbGVjdGVkUm9sZX0gLz5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8Um9sZVBsYXllckVudHJ5XG4gICAgICAgICAgICBrZXk9e25hbWV9XG4gICAgICAgICAgICBuYW1lPXtuYW1lfVxuICAgICAgICAgICAgY29udGVudD17Y29udGVudH1cbiAgICAgICAgICAgIHNlbGVjdGVkPXtzZWxlY3RlZH1cbiAgICAgICAgICAgIGNvbmZpcm1lZD17c2VsZWN0ZWQgJiYgY29uZmlybWVkfVxuXG4gICAgICAgICAgICBvbkNsaWNrU2hvdz17dGhpcy5wcm9wcy5vbkNsaWNrU2hvd31cbiAgICAgICAgICAgIG9uQ2xpY2tDb25maXJtPXt0aGlzLnByb3BzLm9uQ2xpY2tDb25maXJtfVxuICAgICAgICAgICAgb25DbGlja0JhY2s9e3RoaXMucHJvcHMub25DbGlja0NhbmNlbH0gLz5cblxuICAgIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb2xlc1BhZ2VcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUFQgPSBSZWFjdC5Qcm9wVHlwZXNcbnZhciBjeCA9IGNsYXNzbmFtZXNcblxudmFyIFNldHRpbmdzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvLyBNYXBwaW5nIG9mIHNldHRpbmdzIHRvIHRoZWlyIHZhbHVlcy5cbiAgICAgICAgc2V0dGluZ3M6IFBULm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgICBvbkNoYW5nZVNldHRpbmdzOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZXR0aW5nT3JkZXIgPSBbJ21vcmdhbmEnLCAnbW9yZHJlZCcsICdvYmVyb24nLCAnbWVybGluJywgJ3BlcmNpdmFsJ11cbiAgICAgICAgdmFyIGl0ZW1zID0gc2V0dGluZ09yZGVyLm1hcChmdW5jdGlvbihzZXR0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gPGxpIGtleT17c2V0dGluZ30+PFRvZ2dsZVxuICAgICAgICAgICAgICAgIHNldHRpbmc9e3NldHRpbmd9XG4gICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMucHJvcHMuc2V0dGluZ3Nbc2V0dGluZ119XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25DaGFuZ2VTZXR0aW5nfSAvPjwvbGk+XG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwic2V0dGluZ3NcIj5cbiAgICAgICAgICAgIDxoMj5TcGVjaWFsIFJvbGVzPC9oMj5cbiAgICAgICAgICAgIDx1bD57aXRlbXN9PC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgfSxcblxuICAgIG9uQ2hhbmdlU2V0dGluZzogZnVuY3Rpb24oc2V0dGluZykge1xuICAgICAgICB2YXIgY2hhbmdlcyA9IHt9XG4gICAgICAgIGNoYW5nZXNbc2V0dGluZ10gPSAhdGhpcy5wcm9wcy5zZXR0aW5nc1tzZXR0aW5nXVxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlU2V0dGluZ3MoY2hhbmdlcylcbiAgICB9LFxufSk7XG5cbnZhciBUb2dnbGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHNldHRpbmc6IFBULnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICB2YWx1ZTogUFQuYm9vbC5pc1JlcXVpcmVkLFxuICAgICAgICBvbkNoYW5nZTogUFQuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPXtjeCh7XG4gICAgICAgICAgICAgICAgJ3RvZ2dsZSc6IHRydWUsXG4gICAgICAgICAgICAgICAgJ2FjdGl2ZSc6IHRoaXMucHJvcHMudmFsdWUsXG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja30+XG4gICAgICAgICAgICB7Y2FwaXRhbGl6ZSh0aGlzLnByb3BzLnNldHRpbmcpfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICB9LFxuXG4gICAgb25DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UodGhpcy5wcm9wcy5zZXR0aW5nKVxuICAgIH0sXG59KTtcblxuZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFNldHVwUGxheWVyTGlzdCA9IHJlcXVpcmUoJy4vc2V0dXAtcGxheWVyLWxpc3QuanN4JylcbnZhciBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vc2V0dGluZ3MuanN4JylcbnZhciBQVCA9IFJlYWN0LlByb3BUeXBlc1xuXG52YXIgU2V0dXBQYWdlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHByb3BUeXBlczoge1xuICAgICAgICBwbGF5ZXJOYW1lczogUFQuYXJyYXkuaXNSZXF1aXJlZCxcbiAgICAgICAgLy8gTWFwcGluZyBvZiBzZXR0aW5ncyB0byB0aGVpciB2YWx1ZXMuXG4gICAgICAgIHNldHRpbmdzOiBQVC5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgICAgb25BZGROYW1lOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uRGVsZXRlTmFtZTogUFQuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBvbkNoYW5nZVNldHRpbmdzOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uTmV3Um9sZXM6IFBULmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8U2V0dXBQbGF5ZXJMaXN0XG4gICAgICAgICAgICAgICAgcGxheWVyTmFtZXM9e3RoaXMucHJvcHMucGxheWVyTmFtZXN9XG4gICAgICAgICAgICAgICAgb25BZGROYW1lPXt0aGlzLnByb3BzLm9uQWRkTmFtZX1cbiAgICAgICAgICAgICAgICBvbkRlbGV0ZU5hbWU9e3RoaXMucHJvcHMub25EZWxldGVOYW1lfSAvPlxuICAgICAgICAgICAgPFNldHRpbmdzXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M9e3RoaXMucHJvcHMuc2V0dGluZ3N9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2VTZXR0aW5ncz17dGhpcy5wcm9wcy5vbkNoYW5nZVNldHRpbmdzfSAvPlxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJuZXctZ2FtZVwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5vbk5ld1JvbGVzfT5OZXcgR2FtZTwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dXBQYWdlXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIE5ld05hbWUgPSByZXF1aXJlKCcuL25ldy1uYW1lLmpzeCcpXG52YXIgUGxheWVyQ2hpcCA9IHJlcXVpcmUoJy4vcGxheWVyLWNoaXAuanN4JylcbnZhciBQVCA9IFJlYWN0LlByb3BUeXBlc1xuXG52YXIgU2V0dXBQbGF5ZXJMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHByb3BUeXBlczoge1xuICAgICAgICBwbGF5ZXJOYW1lczogUFQuYXJyYXkuaXNSZXF1aXJlZCxcbiAgICAgICAgb25EZWxldGVOYW1lOiBQVC5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQWRkTmFtZTogUFQuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSB0aGlzLnByb3BzLnBsYXllck5hbWVzLm1hcChcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRW50cnkpXG5cbiAgICAgICAgcmV0dXJuIDxkaXY+PGgyPlBsYXllcnM8L2gyPlxuICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInBsYXllci1saXN0XCI+XG4gICAgICAgICAgICAgICAge2VsZW1lbnRzfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgPE5ld05hbWUgb25BZGROYW1lPXt0aGlzLnByb3BzLm9uQWRkTmFtZX0gLz5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgfSxcblxuICAgIHJlbmRlckVudHJ5OiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciBvbkNsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRGVsZXRlTmFtZShuYW1lKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiA8bGkga2V5PXtuYW1lfT5cbiAgICAgICAgICAgIDxQbGF5ZXJDaGlwIG5hbWU9e25hbWV9IC8+XG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZGVsZXRlJ1xuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2xpY2t9PlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvbGk+XG4gICAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHVwUGxheWVyTGlzdFxuIiwibW9kdWxlLmV4cG9ydHMgPSBzdG9yZV9yZXNldFxuXG5mdW5jdGlvbiBzdG9yZV9yZXNldCh2ZXJzaW9uKSB7XG4gICAgdmFyIHN0b3JlZCA9IHN0b3JlLmdldCgnU1RPUkVfREJfVkVSU0lPTicpXG4gICAgaWYgKHN0b3JlZCA9PT0gdmVyc2lvbikge1xuICAgICAgICByZXR1cm5cbiAgICB9IGVsc2Uge1xuICAgICAgICBzdG9yZS5jbGVhcigpXG4gICAgICAgIHN0b3JlLnNldCgnU1RPUkVfREJfVkVSU0lPTicsIHZlcnNpb24pXG4gICAgfVxufVxuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lMMmh2YldVdmJXbHNaWE12WTI5a1pTOXlaV0ZqZEdGdVkyVXZjMk55YVhCMGN5OXpkRzl5WlMxeVpYTmxkQzVxY3lJc0luTnZkWEpqWlhNaU9sc2lMMmh2YldVdmJXbHNaWE12WTI5a1pTOXlaV0ZqZEdGdVkyVXZjMk55YVhCMGN5OXpkRzl5WlMxeVpYTmxkQzVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTeE5RVUZOTEVOQlFVTXNUMEZCVHl4SFFVRkhMRmRCUVZjN08wRkJSVFZDTEZOQlFWTXNWMEZCVnl4RFFVRkRMRTlCUVU4c1JVRkJSVHRKUVVNeFFpeEpRVUZKTEUxQlFVMHNSMEZCUnl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExHdENRVUZyUWl4RFFVRkRPMGxCUXpGRExFbEJRVWtzVFVGQlRTeExRVUZMTEU5QlFVOHNSVUZCUlR0UlFVTndRaXhOUVVGTk8wdEJRMVFzVFVGQlRUdFJRVU5JTEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVN1VVRkRZaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEd0Q1FVRnJRaXhGUVVGRkxFOUJRVThzUTBGQlF6dExRVU42UXp0RFFVTktJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpYlc5a2RXeGxMbVY0Y0c5eWRITWdQU0J6ZEc5eVpWOXlaWE5sZEZ4dVhHNW1kVzVqZEdsdmJpQnpkRzl5WlY5eVpYTmxkQ2gyWlhKemFXOXVLU0I3WEc0Z0lDQWdkbUZ5SUhOMGIzSmxaQ0E5SUhOMGIzSmxMbWRsZENnblUxUlBVa1ZmUkVKZlZrVlNVMGxQVGljcFhHNGdJQ0FnYVdZZ0tITjBiM0psWkNBOVBUMGdkbVZ5YzJsdmJpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNWNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNCemRHOXlaUzVqYkdWaGNpZ3BYRzRnSUNBZ0lDQWdJSE4wYjNKbExuTmxkQ2duVTFSUFVrVmZSRUpmVmtWU1UwbFBUaWNzSUhabGNuTnBiMjRwWEc0Z0lDQWdmVnh1ZlZ4dUlsMTkiLCJ2YXIgQmFja2JvbmVFdmVudHMgPSByZXF1aXJlKFwiYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RvcmVcblxuZnVuY3Rpb24gU3RvcmUoKSB7XG4gICAgdGhpcy5fZXZlbnRlciA9IEJhY2tib25lRXZlbnRzLm1peGluKHt9KVxuICAgIHRoaXMuX2VtaXRDaGFuZ2VCYXRjaGVyID0gbnVsbFxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gZmlyZSBvbiBjaGFuZ2UgZXZlbnRzLlxuICovXG5TdG9yZS5wcm90b3R5cGUub25DaGFuZ2UgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHRoaXMuX2V2ZW50ZXIub24oJ2NoYW5nZScsIGNhbGxiYWNrKVxufVxuXG4vKipcbiAqIFVucmVnaXN0ZXIgYSBjYWxsYmFjayBwcmV2aW91c2x5IHJlZ2lzdGVyZCB3aXRoIG9uQ2hhbmdlLlxuICovXG5TdG9yZS5wcm90b3R5cGUub2ZmQ2hhbmdlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLl9ldmVudGVyLm9mZignY2hhbmdlJywgY2FsbGJhY2spXG59XG5cbi8qKlxuICogRmlyZSBhIGNoYW5nZSBldmVudCBmb3IgdGhpcyBzdG9yZVxuICogVGhpcyBzaG91bGQgcHJvYmFibHkgb25seSBiZSBjYWxsZWQgYnkgdGhlIHN0b3JlIGl0c2VsZlxuICogYWZ0ZXIgaXQgbXV0YXRlcyBzdGF0ZS5cbiAqXG4gKiBUaGVzZSBhcmUgYmF0Y2hlZCB1c2luZyBzZXRUaW1lb3V0LlxuICogSSBkb24ndCBhY3R1YWxseSBrbm93IGVub3VnaCB0byBrbm93IHdoZXRoZXIgdGhpcyBpcyBhIGdvb2QgaWRlYS5cbiAqIEJ1dCBpdCdzIGZ1biB0byB0aGluayBhYm91dC5cbiAqIFRoaXMgaXMgTk9UIGRvbmUgZm9yIHBlcmZvcm1hbmNlLCBidXQgdG8gb25seSBlbWl0IGNoYW5nZXNcbiAqIHdoZW4gdGhlIHN0b3JlIGhhcyBzZXR0bGVkIGludG8gYSBjb25zaXN0ZW50IHN0YXRlLlxuICovXG5TdG9yZS5wcm90b3R5cGUuZW1pdENoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9lbWl0Q2hhbmdlQmF0Y2hlciA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9lbWl0Q2hhbmdlQmF0Y2hlciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudGVyLnRyaWdnZXIoJ2NoYW5nZScpXG4gICAgICAgICAgICB0aGlzLl9lbWl0Q2hhbmdlQmF0Y2hlciA9IG51bGxcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAxMClcbiAgICB9XG59XG5cbi8qKlxuICogTWl4IGludG8gYW4gb2JqZWN0IHRvIG1ha2UgaXQgYSBzdG9yZS5cbiAqIEV4YW1wbGU6XG4gKiBmdW5jdGlvbiBBd2Vzb21lU3RvcmUoKSB7XG4gKiAgIFN0b3JlLm1peGluKHRoaXMpXG4gKiB9XG4gKi9cblN0b3JlLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKClcbiAgICBvYmoub25DaGFuZ2UgPSBzdG9yZS5vbkNoYW5nZS5iaW5kKHN0b3JlKVxuICAgIG9iai5vZmZDaGFuZ2UgPSBzdG9yZS5vZmZDaGFuZ2UuYmluZChzdG9yZSlcbiAgICBvYmouZW1pdENoYW5nZSA9IHN0b3JlLmVtaXRDaGFuZ2UuYmluZChzdG9yZSlcbn1cblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pTDJodmJXVXZiV2xzWlhNdlkyOWtaUzl5WldGamRHRnVZMlV2YzJOeWFYQjBjeTl6ZEc5eVpTNXFjeUlzSW5OdmRYSmpaWE1pT2xzaUwyaHZiV1V2Yldsc1pYTXZZMjlrWlM5eVpXRmpkR0Z1WTJVdmMyTnlhWEIwY3k5emRHOXlaUzVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTeEpRVUZKTEdOQlFXTXNSMEZCUnl4UFFVRlBMRU5CUVVNc05FSkJRVFJDTEVOQlFVTXNRMEZCUXpzN1FVRkZNMFFzVFVGQlRTeERRVUZETEU5QlFVOHNSMEZCUnl4TFFVRkxPenRCUVVWMFFpeFRRVUZUTEV0QlFVc3NSMEZCUnp0SlFVTmlMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzWTBGQll5eERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNN1NVRkRlRU1zU1VGQlNTeERRVUZETEd0Q1FVRnJRaXhIUVVGSExFbEJRVWs3UVVGRGJFTXNRMEZCUXpzN1FVRkZSRHM3UjBGRlJ6dEJRVU5JTEV0QlFVc3NRMEZCUXl4VFFVRlRMRU5CUVVNc1VVRkJVU3hIUVVGSExGTkJRVk1zVVVGQlVTeEZRVUZGTzBsQlF6RkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUlVGQlJTeERRVUZETEZGQlFWRXNSVUZCUlN4UlFVRlJMRU5CUVVNN1FVRkRlRU1zUTBGQlF6czdRVUZGUkRzN1IwRkZSenRCUVVOSUxFdEJRVXNzUTBGQlF5eFRRVUZUTEVOQlFVTXNVMEZCVXl4SFFVRkhMRk5CUVZNc1VVRkJVU3hGUVVGRk8wbEJRek5ETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExGRkJRVkVzUlVGQlJTeFJRVUZSTEVOQlFVTTdRVUZEZWtNc1EwRkJRenM3UVVGRlJEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBkQlJVYzdRVUZEU0N4TFFVRkxMRU5CUVVNc1UwRkJVeXhEUVVGRExGVkJRVlVzUjBGQlJ5eFhRVUZYTzBsQlEzQkRMRWxCUVVrc1NVRkJTU3hEUVVGRExHdENRVUZyUWl4TFFVRkxMRWxCUVVrc1JVRkJSVHRSUVVOc1F5eEpRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFZEJRVWNzVlVGQlZTeERRVUZETEZkQlFWYzdXVUZETlVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNVVUZCVVN4RFFVRkRPMWxCUXk5Q0xFbEJRVWtzUTBGQlF5eHJRa0ZCYTBJc1IwRkJSeXhKUVVGSk8xTkJRMnBETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dExRVU53UWp0QlFVTk1MRU5CUVVNN08wRkJSVVE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1IwRkZSenRCUVVOSUxFdEJRVXNzUTBGQlF5eExRVUZMTEVkQlFVY3NVMEZCVXl4SFFVRkhMRVZCUVVVN1NVRkRlRUlzU1VGQlNTeExRVUZMTEVkQlFVY3NTVUZCU1N4TFFVRkxMRVZCUVVVN1NVRkRka0lzUjBGQlJ5eERRVUZETEZGQlFWRXNSMEZCUnl4TFFVRkxMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdTVUZEZWtNc1IwRkJSeXhEUVVGRExGTkJRVk1zUjBGQlJ5eExRVUZMTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03U1VGRE0wTXNSMEZCUnl4RFFVRkRMRlZCUVZVc1IwRkJSeXhMUVVGTExFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1EwRkRhRVFpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdRbUZqYTJKdmJtVkZkbVZ1ZEhNZ1BTQnlaWEYxYVhKbEtGd2lZbUZqYTJKdmJtVXRaWFpsYm5SekxYTjBZVzVrWVd4dmJtVmNJaWs3WEc1Y2JtMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ1UzUnZjbVZjYmx4dVpuVnVZM1JwYjI0Z1UzUnZjbVVvS1NCN1hHNGdJQ0FnZEdocGN5NWZaWFpsYm5SbGNpQTlJRUpoWTJ0aWIyNWxSWFpsYm5SekxtMXBlR2x1S0h0OUtWeHVJQ0FnSUhSb2FYTXVYMlZ0YVhSRGFHRnVaMlZDWVhSamFHVnlJRDBnYm5Wc2JGeHVmVnh1WEc0dktpcGNiaUFxSUZKbFoybHpkR1Z5SUdFZ1kyRnNiR0poWTJzZ2RHOGdabWx5WlNCdmJpQmphR0Z1WjJVZ1pYWmxiblJ6TGx4dUlDb3ZYRzVUZEc5eVpTNXdjbTkwYjNSNWNHVXViMjVEYUdGdVoyVWdQU0JtZFc1amRHbHZiaWhqWVd4c1ltRmpheWtnZTF4dUlDQWdJSFJvYVhNdVgyVjJaVzUwWlhJdWIyNG9KMk5vWVc1blpTY3NJR05oYkd4aVlXTnJLVnh1ZlZ4dVhHNHZLaXBjYmlBcUlGVnVjbVZuYVhOMFpYSWdZU0JqWVd4c1ltRmpheUJ3Y21WMmFXOTFjMng1SUhKbFoybHpkR1Z5WkNCM2FYUm9JRzl1UTJoaGJtZGxMbHh1SUNvdlhHNVRkRzl5WlM1d2NtOTBiM1I1Y0dVdWIyWm1RMmhoYm1kbElEMGdablZ1WTNScGIyNG9ZMkZzYkdKaFkyc3BJSHRjYmlBZ0lDQjBhR2x6TGw5bGRtVnVkR1Z5TG05bVppZ25ZMmhoYm1kbEp5d2dZMkZzYkdKaFkyc3BYRzU5WEc1Y2JpOHFLbHh1SUNvZ1JtbHlaU0JoSUdOb1lXNW5aU0JsZG1WdWRDQm1iM0lnZEdocGN5QnpkRzl5WlZ4dUlDb2dWR2hwY3lCemFHOTFiR1FnY0hKdlltRmliSGtnYjI1c2VTQmlaU0JqWVd4c1pXUWdZbmtnZEdobElITjBiM0psSUdsMGMyVnNabHh1SUNvZ1lXWjBaWElnYVhRZ2JYVjBZWFJsY3lCemRHRjBaUzVjYmlBcVhHNGdLaUJVYUdWelpTQmhjbVVnWW1GMFkyaGxaQ0IxYzJsdVp5QnpaWFJVYVcxbGIzVjBMbHh1SUNvZ1NTQmtiMjRuZENCaFkzUjFZV3hzZVNCcmJtOTNJR1Z1YjNWbmFDQjBieUJyYm05M0lIZG9aWFJvWlhJZ2RHaHBjeUJwY3lCaElHZHZiMlFnYVdSbFlTNWNiaUFxSUVKMWRDQnBkQ2R6SUdaMWJpQjBieUIwYUdsdWF5QmhZbTkxZEM1Y2JpQXFJRlJvYVhNZ2FYTWdUazlVSUdSdmJtVWdabTl5SUhCbGNtWnZjbTFoYm1ObExDQmlkWFFnZEc4Z2IyNXNlU0JsYldsMElHTm9ZVzVuWlhOY2JpQXFJSGRvWlc0Z2RHaGxJSE4wYjNKbElHaGhjeUJ6WlhSMGJHVmtJR2x1ZEc4Z1lTQmpiMjV6YVhOMFpXNTBJSE4wWVhSbExseHVJQ292WEc1VGRHOXlaUzV3Y205MGIzUjVjR1V1WlcxcGRFTm9ZVzVuWlNBOUlHWjFibU4wYVc5dUtDa2dlMXh1SUNBZ0lHbG1JQ2gwYUdsekxsOWxiV2wwUTJoaGJtZGxRbUYwWTJobGNpQTlQVDBnYm5Wc2JDa2dlMXh1SUNBZ0lDQWdJQ0IwYUdsekxsOWxiV2wwUTJoaGJtZGxRbUYwWTJobGNpQTlJSE5sZEZScGJXVnZkWFFvWm5WdVkzUnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxsOWxkbVZ1ZEdWeUxuUnlhV2RuWlhJb0oyTm9ZVzVuWlNjcFhHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxsOWxiV2wwUTJoaGJtZGxRbUYwWTJobGNpQTlJRzUxYkd4Y2JpQWdJQ0FnSUNBZ2ZTNWlhVzVrS0hSb2FYTXBMQ0F4TUNsY2JpQWdJQ0I5WEc1OVhHNWNiaThxS2x4dUlDb2dUV2w0SUdsdWRHOGdZVzRnYjJKcVpXTjBJSFJ2SUcxaGEyVWdhWFFnWVNCemRHOXlaUzVjYmlBcUlFVjRZVzF3YkdVNlhHNGdLaUJtZFc1amRHbHZiaUJCZDJWemIyMWxVM1J2Y21Vb0tTQjdYRzRnS2lBZ0lGTjBiM0psTG0xcGVHbHVLSFJvYVhNcFhHNGdLaUI5WEc0Z0tpOWNibE4wYjNKbExtMXBlR2x1SUQwZ1puVnVZM1JwYjI0b2IySnFLU0I3WEc0Z0lDQWdkbUZ5SUhOMGIzSmxJRDBnYm1WM0lGTjBiM0psS0NsY2JpQWdJQ0J2WW1vdWIyNURhR0Z1WjJVZ1BTQnpkRzl5WlM1dmJrTm9ZVzVuWlM1aWFXNWtLSE4wYjNKbEtWeHVJQ0FnSUc5aWFpNXZabVpEYUdGdVoyVWdQU0J6ZEc5eVpTNXZabVpEYUdGdVoyVXVZbWx1WkNoemRHOXlaU2xjYmlBZ0lDQnZZbW91WlcxcGRFTm9ZVzVuWlNBOUlITjBiM0psTG1WdGFYUkRhR0Z1WjJVdVltbHVaQ2h6ZEc5eVpTbGNibjFjYmlKZGZRPT0iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFBUID0gUmVhY3QuUHJvcFR5cGVzXG52YXIgY3ggPSBjbGFzc25hbWVzXG5cbnZhciBUYWJzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHByb3BUeXBlczoge1xuICAgICAgICBhY3RpdmVUYWI6IFBULnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBvbkNoYW5nZVRhYjogUFQuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICB0YWJzOiBQVC5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8bmF2PlxuICAgICAgICAgICAge3RoaXMucmVuZGVyQnV0dG9ucygpfVxuICAgICAgICAgICAgPC9uYXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRhYi1jb250ZW50c1wiPlxuICAgICAgICAgICAge3RoaXMucHJvcHMudGFic1t0aGlzLnByb3BzLmFjdGl2ZVRhYl0uY29udGVudH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICB9LFxuXG4gICAgcmVuZGVyQnV0dG9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLnByb3BzLnRhYnMsIGZ1bmN0aW9uKHZhbCwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIGNoYW5nZVRhYiA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlVGFiKG5hbWUpXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcblxuICAgICAgICAgICAgcmV0dXJuIDxhXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjeCh7XG4gICAgICAgICAgICAgICAgICAgICdhY3RpdmUnOiB0aGlzLnByb3BzLmFjdGl2ZVRhYiA9PT0gbmFtZSxcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICBrZXk9e25hbWV9XG4gICAgICAgICAgICAgICAgZGF0YS1uYW1lPXtuYW1lfVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2NoYW5nZVRhYn1cbiAgICAgICAgICAgICAgICBvblRvdWNoU3RhcnQ9e2NoYW5nZVRhYn0gPlxuICAgICAgICAgICAgICAgIHt2YWwubmFtZX08L2E+XG4gICAgICAgIH0uYmluZCh0aGlzKSkgXG4gICAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYnNcbiIsInZhciBTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJU3RhdGVcblxuZnVuY3Rpb24gVUlTdGF0ZShkaXNwYXRjaGVyKSB7XG4gICAgU3RvcmUubWl4aW4odGhpcylcblxuICAgIHRoaXMudGFiID0gJ3NldHVwJ1xuICAgIHRoaXMuc2VsZWN0ZWRQbGF5ZXIgPSBudWxsXG4gICAgdGhpcy5zZWxlY3Rpb25Db25maXJtZWQgPSBmYWxzZVxuICAgIHRoaXMubWlzc2lvblJldmVhbGVkID0gZmFsc2VcblxuICAgIGRpc3BhdGNoZXIub25BY3Rpb24oZnVuY3Rpb24ocGF5bG9hZCkge1xuICAgICAgICB2YXIgYWN0aW9ucyA9IFVJU3RhdGUuYWN0aW9uc1xuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGFjdGlvbnNbcGF5bG9hZC5hY3Rpb25dKSkge1xuICAgICAgICAgICAgYWN0aW9uc1twYXlsb2FkLmFjdGlvbl0uY2FsbCh0aGlzLCBwYXlsb2FkKVxuICAgICAgICAgICAgdGhpcy5zYXZlKClcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSlcbn1cblxudmFyIFBFUlNJU1RfS0VZUyA9IFsndGFiJywgJ3NlbGVjdGVkUGxheWVyJywgJ3NlbGVjdGlvbkNvbmZpcm1lZCcsICdtaXNzaW9uUmV2ZWFsZWQnXVxuXG5VSVN0YXRlLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBlcnNpc3QgPSB7fVxuICAgIFBFUlNJU1RfS0VZUy5mb3JFYWNoKGtleSA9PiBwZXJzaXN0W2tleV0gPSB0aGlzW2tleV0pXG4gICAgc3RvcmUuc2V0KCdzdG9yZS51aXN0YXRlJywgcGVyc2lzdClcbn1cblxuVUlTdGF0ZS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwZXJzaXN0ID0gc3RvcmUuZ2V0KCdzdG9yZS51aXN0YXRlJylcbiAgICBpZiAocGVyc2lzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFBFUlNJU1RfS0VZUy5mb3JFYWNoKGtleSA9PiB0aGlzW2tleV0gPSBwZXJzaXN0W2tleV0pXG4gICAgfVxufVxuXG5cblVJU3RhdGUuYWN0aW9ucyA9IHt9XG5cblVJU3RhdGUuYWN0aW9ucy5jaGFuZ2VUYWIgPSBmdW5jdGlvbih7dGFifSkge1xuICAgIHRoaXMudGFiID0gdGFiXG4gICAgdGhpcy5zZWxlY3RlZFBsYXllciA9IG51bGxcbiAgICB0aGlzLnNlbGVjdGlvbkNvbmZpcm1lZCA9IGZhbHNlXG4gICAgdGhpcy5lbWl0Q2hhbmdlKClcbn1cblxuVUlTdGF0ZS5hY3Rpb25zLnNlbGVjdFBsYXllciA9IGZ1bmN0aW9uKHtuYW1lfSkge1xuICAgIHRoaXMuc2VsZWN0ZWRQbGF5ZXIgPSBuYW1lXG4gICAgdGhpcy5zZWxlY3Rpb25Db25maXJtZWQgPSBmYWxzZVxuICAgIHRoaXMuZW1pdENoYW5nZSgpXG59XG5cblVJU3RhdGUuYWN0aW9ucy5jb25maXJtUGxheWVyID0gZnVuY3Rpb24oe25hbWV9KSB7XG4gICAgdGhpcy5zZWxlY3RlZFBsYXllciA9IG5hbWVcbiAgICB0aGlzLnNlbGVjdGlvbkNvbmZpcm1lZCA9IHRydWVcbiAgICB0aGlzLmVtaXRDaGFuZ2UoKVxufVxuXG5VSVN0YXRlLmFjdGlvbnMuZGVzZWxlY3RQbGF5ZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNlbGVjdGVkUGxheWVyID0gbnVsbFxuICAgIHRoaXMuc2VsZWN0aW9uQ29uZmlybWVkID0gZmFsc2VcbiAgICB0aGlzLmVtaXRDaGFuZ2UoKVxufVxuXG5VSVN0YXRlLmFjdGlvbnMubWlzc2lvblJldmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubWlzc2lvblJldmVhbGVkID0gdHJ1ZVxuICAgIHRoaXMuZW1pdENoYW5nZSgpXG59XG5cblVJU3RhdGUuYWN0aW9ucy5taXNzaW9uUmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm1pc3Npb25SZXZlYWxlZCA9IGZhbHNlXG4gICAgdGhpcy5lbWl0Q2hhbmdlKClcbn1cblxuVUlTdGF0ZS5hY3Rpb25zLm5ld1JvbGVzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50YWIgPSAncm9sZXMnXG4gICAgdGhpcy5zZWxlY3RlZFBsYXllciA9IG51bGxcbiAgICB0aGlzLnNlbGVjdGlvbkNvbmZpcm1lZCA9IGZhbHNlXG4gICAgdGhpcy5lbWl0Q2hhbmdlKClcbn1cblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pTDJodmJXVXZiV2xzWlhNdlkyOWtaUzl5WldGamRHRnVZMlV2YzJOeWFYQjBjeTkxYVMxemRHRjBaUzVxY3lJc0luTnZkWEpqWlhNaU9sc2lMMmh2YldVdmJXbHNaWE12WTI5a1pTOXlaV0ZqZEdGdVkyVXZjMk55YVhCMGN5OTFhUzF6ZEdGMFpTNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lRVUZCUVN4SlFVRkpMRXRCUVVzc1IwRkJSeXhQUVVGUExFTkJRVU1zVTBGQlV5eERRVUZET3p0QlFVVTVRaXhOUVVGTkxFTkJRVU1zVDBGQlR5eEhRVUZITEU5QlFVODdPMEZCUlhoQ0xGTkJRVk1zVDBGQlR5eERRVUZETEZWQlFWVXNSVUZCUlR0QlFVTTNRaXhKUVVGSkxFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRPenRKUVVWcVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4SFFVRkhMRTlCUVU4N1NVRkRiRUlzU1VGQlNTeERRVUZETEdOQlFXTXNSMEZCUnl4SlFVRkpPMGxCUXpGQ0xFbEJRVWtzUTBGQlF5eHJRa0ZCYTBJc1IwRkJSeXhMUVVGTE8wRkJRMjVETEVsQlFVa3NTVUZCU1N4RFFVRkRMR1ZCUVdVc1IwRkJSeXhMUVVGTE96dEpRVVUxUWl4VlFVRlZMRU5CUVVNc1VVRkJVU3hEUVVGRExGTkJRVk1zVDBGQlR5eEZRVUZGTzFGQlEyeERMRWxCUVVrc1QwRkJUeXhIUVVGSExFOUJRVThzUTBGQlF5eFBRVUZQTzFGQlF6ZENMRWxCUVVrc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eFBRVUZQTEVOQlFVTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVU3V1VGRGRrTXNUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRTlCUVU4c1EwRkJRenRaUVVNelF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZPMU5CUTJRN1MwRkRTaXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0QlFVTnFRaXhEUVVGRE96dEJRVVZFTEVsQlFVa3NXVUZCV1N4SFFVRkhMRU5CUVVNc1MwRkJTeXhGUVVGRkxHZENRVUZuUWl4RlFVRkZMRzlDUVVGdlFpeEZRVUZGTEdsQ1FVRnBRaXhEUVVGRE96dEJRVVZ5Uml4UFFVRlBMRU5CUVVNc1UwRkJVeXhEUVVGRExFbEJRVWtzUjBGQlJ5eFhRVUZYTzBsQlEyaERMRWxCUVVrc1QwRkJUeXhIUVVGSExFVkJRVVU3U1VGRGFFSXNXVUZCV1N4RFFVRkRMRTlCUVU4c1EwRkJReXhIUVVGSExFbEJRVWtzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU55UkN4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExHVkJRV1VzUlVGQlJTeFBRVUZQTEVOQlFVTTdRVUZEZGtNc1EwRkJRenM3UVVGRlJDeFBRVUZQTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhYUVVGWE8wbEJRMmhETEVsQlFVa3NUMEZCVHl4SFFVRkhMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zWlVGQlpTeERRVUZETzBsQlEzaERMRWxCUVVrc1QwRkJUeXhMUVVGTExGTkJRVk1zUlVGQlJUdFJRVU4yUWl4WlFVRlpMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzU1VGQlNTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzB0QlEzaEVPMEZCUTB3c1EwRkJRenRCUVVORU96dEJRVVZCTEU5QlFVOHNRMEZCUXl4UFFVRlBMRWRCUVVjc1JVRkJSVHM3UVVGRmNFSXNUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhUUVVGVExFZEJRVWNzVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPMGxCUTNoRExFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnp0SlFVTmtMRWxCUVVrc1EwRkJReXhqUVVGakxFZEJRVWNzU1VGQlNUdEpRVU14UWl4SlFVRkpMRU5CUVVNc2EwSkJRV3RDTEVkQlFVY3NTMEZCU3p0SlFVTXZRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEZRVUZGTzBGQlEzSkNMRU5CUVVNN08wRkJSVVFzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4WlFVRlpMRWRCUVVjc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzBsQlF6VkRMRWxCUVVrc1EwRkJReXhqUVVGakxFZEJRVWNzU1VGQlNUdEpRVU14UWl4SlFVRkpMRU5CUVVNc2EwSkJRV3RDTEVkQlFVY3NTMEZCU3p0SlFVTXZRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEZRVUZGTzBGQlEzSkNMRU5CUVVNN08wRkJSVVFzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4aFFVRmhMRWRCUVVjc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzBsQlF6ZERMRWxCUVVrc1EwRkJReXhqUVVGakxFZEJRVWNzU1VGQlNUdEpRVU14UWl4SlFVRkpMRU5CUVVNc2EwSkJRV3RDTEVkQlFVY3NTVUZCU1R0SlFVTTVRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEZRVUZGTzBGQlEzSkNMRU5CUVVNN08wRkJSVVFzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4alFVRmpMRWRCUVVjc1YwRkJWenRKUVVONFF5eEpRVUZKTEVOQlFVTXNZMEZCWXl4SFFVRkhMRWxCUVVrN1NVRkRNVUlzU1VGQlNTeERRVUZETEd0Q1FVRnJRaXhIUVVGSExFdEJRVXM3U1VGREwwSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1JVRkJSVHRCUVVOeVFpeERRVUZET3p0QlFVVkVMRTlCUVU4c1EwRkJReXhQUVVGUExFTkJRVU1zWVVGQllTeEhRVUZITEZkQlFWYzdTVUZEZGtNc1NVRkJTU3hEUVVGRExHVkJRV1VzUjBGQlJ5eEpRVUZKTzBsQlF6TkNMRWxCUVVrc1EwRkJReXhWUVVGVkxFVkJRVVU3UVVGRGNrSXNRMEZCUXpzN1FVRkZSQ3hQUVVGUExFTkJRVU1zVDBGQlR5eERRVUZETEZsQlFWa3NSMEZCUnl4WFFVRlhPMGxCUTNSRExFbEJRVWtzUTBGQlF5eGxRVUZsTEVkQlFVY3NTMEZCU3p0SlFVTTFRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEZRVUZGTzBGQlEzSkNMRU5CUVVNN08wRkJSVVFzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4UlFVRlJMRWRCUVVjc1YwRkJWenRKUVVOc1F5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SFFVRkhMRTlCUVU4N1NVRkRiRUlzU1VGQlNTeERRVUZETEdOQlFXTXNSMEZCUnl4SlFVRkpPMGxCUXpGQ0xFbEJRVWtzUTBGQlF5eHJRa0ZCYTBJc1IwRkJSeXhMUVVGTE8wbEJReTlDTEVsQlFVa3NRMEZCUXl4VlFVRlZMRVZCUVVVN1EwRkRjRUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdVM1J2Y21VZ1BTQnlaWEYxYVhKbEtDY3VMM04wYjNKbEp5bGNibHh1Ylc5a2RXeGxMbVY0Y0c5eWRITWdQU0JWU1ZOMFlYUmxYRzVjYm1aMWJtTjBhVzl1SUZWSlUzUmhkR1VvWkdsemNHRjBZMmhsY2lrZ2UxeHVJQ0FnSUZOMGIzSmxMbTFwZUdsdUtIUm9hWE1wWEc1Y2JpQWdJQ0IwYUdsekxuUmhZaUE5SUNkelpYUjFjQ2RjYmlBZ0lDQjBhR2x6TG5ObGJHVmpkR1ZrVUd4aGVXVnlJRDBnYm5Wc2JGeHVJQ0FnSUhSb2FYTXVjMlZzWldOMGFXOXVRMjl1Wm1seWJXVmtJRDBnWm1Gc2MyVmNiaUFnSUNCMGFHbHpMbTFwYzNOcGIyNVNaWFpsWVd4bFpDQTlJR1poYkhObFhHNWNiaUFnSUNCa2FYTndZWFJqYUdWeUxtOXVRV04wYVc5dUtHWjFibU4wYVc5dUtIQmhlV3h2WVdRcElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUdGamRHbHZibk1nUFNCVlNWTjBZWFJsTG1GamRHbHZibk5jYmlBZ0lDQWdJQ0FnYVdZZ0tGOHVhWE5HZFc1amRHbHZiaWhoWTNScGIyNXpXM0JoZVd4dllXUXVZV04wYVc5dVhTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHRmpkR2x2Ym5OYmNHRjViRzloWkM1aFkzUnBiMjVkTG1OaGJHd29kR2hwY3l3Z2NHRjViRzloWkNsY2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWMyRjJaU2dwWEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5TG1KcGJtUW9kR2hwY3lrcFhHNTlYRzVjYm5aaGNpQlFSVkpUU1ZOVVgwdEZXVk1nUFNCYkozUmhZaWNzSUNkelpXeGxZM1JsWkZCc1lYbGxjaWNzSUNkelpXeGxZM1JwYjI1RGIyNW1hWEp0WldRbkxDQW5iV2x6YzJsdmJsSmxkbVZoYkdWa0oxMWNibHh1VlVsVGRHRjBaUzV3Y205MGIzUjVjR1V1YzJGMlpTQTlJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJSFpoY2lCd1pYSnphWE4wSUQwZ2UzMWNiaUFnSUNCUVJWSlRTVk5VWDB0RldWTXVabTl5UldGamFDaHJaWGtnUFQ0Z2NHVnljMmx6ZEZ0clpYbGRJRDBnZEdocGMxdHJaWGxkS1Z4dUlDQWdJSE4wYjNKbExuTmxkQ2duYzNSdmNtVXVkV2x6ZEdGMFpTY3NJSEJsY25OcGMzUXBYRzU5WEc1Y2JsVkpVM1JoZEdVdWNISnZkRzkwZVhCbExteHZZV1FnUFNCbWRXNWpkR2x2YmlncElIdGNiaUFnSUNCMllYSWdjR1Z5YzJsemRDQTlJSE4wYjNKbExtZGxkQ2duYzNSdmNtVXVkV2x6ZEdGMFpTY3BYRzRnSUNBZ2FXWWdLSEJsY25OcGMzUWdJVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVJQ0FnSUNBZ0lDQlFSVkpUU1ZOVVgwdEZXVk11Wm05eVJXRmphQ2hyWlhrZ1BUNGdkR2hwYzF0clpYbGRJRDBnY0dWeWMybHpkRnRyWlhsZEtWeHVJQ0FnSUgxY2JuMWNibHh1WEc1VlNWTjBZWFJsTG1GamRHbHZibk1nUFNCN2ZWeHVYRzVWU1ZOMFlYUmxMbUZqZEdsdmJuTXVZMmhoYm1kbFZHRmlJRDBnWm5WdVkzUnBiMjRvZTNSaFluMHBJSHRjYmlBZ0lDQjBhR2x6TG5SaFlpQTlJSFJoWWx4dUlDQWdJSFJvYVhNdWMyVnNaV04wWldSUWJHRjVaWElnUFNCdWRXeHNYRzRnSUNBZ2RHaHBjeTV6Wld4bFkzUnBiMjVEYjI1bWFYSnRaV1FnUFNCbVlXeHpaVnh1SUNBZ0lIUm9hWE11WlcxcGRFTm9ZVzVuWlNncFhHNTlYRzVjYmxWSlUzUmhkR1V1WVdOMGFXOXVjeTV6Wld4bFkzUlFiR0Y1WlhJZ1BTQm1kVzVqZEdsdmJpaDdibUZ0WlgwcElIdGNiaUFnSUNCMGFHbHpMbk5sYkdWamRHVmtVR3hoZVdWeUlEMGdibUZ0WlZ4dUlDQWdJSFJvYVhNdWMyVnNaV04wYVc5dVEyOXVabWx5YldWa0lEMGdabUZzYzJWY2JpQWdJQ0IwYUdsekxtVnRhWFJEYUdGdVoyVW9LVnh1ZlZ4dVhHNVZTVk4wWVhSbExtRmpkR2x2Ym5NdVkyOXVabWx5YlZCc1lYbGxjaUE5SUdaMWJtTjBhVzl1S0h0dVlXMWxmU2tnZTF4dUlDQWdJSFJvYVhNdWMyVnNaV04wWldSUWJHRjVaWElnUFNCdVlXMWxYRzRnSUNBZ2RHaHBjeTV6Wld4bFkzUnBiMjVEYjI1bWFYSnRaV1FnUFNCMGNuVmxYRzRnSUNBZ2RHaHBjeTVsYldsMFEyaGhibWRsS0NsY2JuMWNibHh1VlVsVGRHRjBaUzVoWTNScGIyNXpMbVJsYzJWc1pXTjBVR3hoZVdWeUlEMGdablZ1WTNScGIyNG9LU0I3WEc0Z0lDQWdkR2hwY3k1elpXeGxZM1JsWkZCc1lYbGxjaUE5SUc1MWJHeGNiaUFnSUNCMGFHbHpMbk5sYkdWamRHbHZia052Ym1acGNtMWxaQ0E5SUdaaGJITmxYRzRnSUNBZ2RHaHBjeTVsYldsMFEyaGhibWRsS0NsY2JuMWNibHh1VlVsVGRHRjBaUzVoWTNScGIyNXpMbTFwYzNOcGIyNVNaWFpsWVd3Z1BTQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ0lDQjBhR2x6TG0xcGMzTnBiMjVTWlhabFlXeGxaQ0E5SUhSeWRXVmNiaUFnSUNCMGFHbHpMbVZ0YVhSRGFHRnVaMlVvS1Z4dWZWeHVYRzVWU1ZOMFlYUmxMbUZqZEdsdmJuTXViV2x6YzJsdmJsSmxjMlYwSUQwZ1puVnVZM1JwYjI0b0tTQjdYRzRnSUNBZ2RHaHBjeTV0YVhOemFXOXVVbVYyWldGc1pXUWdQU0JtWVd4elpWeHVJQ0FnSUhSb2FYTXVaVzFwZEVOb1lXNW5aU2dwWEc1OVhHNWNibFZKVTNSaGRHVXVZV04wYVc5dWN5NXVaWGRTYjJ4bGN5QTlJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJSFJvYVhNdWRHRmlJRDBnSjNKdmJHVnpKMXh1SUNBZ0lIUm9hWE11YzJWc1pXTjBaV1JRYkdGNVpYSWdQU0J1ZFd4c1hHNGdJQ0FnZEdocGN5NXpaV3hsWTNScGIyNURiMjVtYVhKdFpXUWdQU0JtWVd4elpWeHVJQ0FnSUhSb2FYTXVaVzFwZEVOb1lXNW5aU2dwWEc1OVhHNGlYWDA9Il19
