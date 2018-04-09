/**
 * @license Copyright 2013 Blue State Digital, Inc.
 * Blue State Digital Google Analytics Integration Library
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *  http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/


/* Set initial defaults. 
*Check to see if _gaq and optimizely are instantiated; if they're not, create empty arrays. This is intentionally global.
Set basic GA defaults to make sites better. 
*/
var _gaq = _gaq || [];
var optimizely = optimizely || [];

_gaq.push(['_setSiteSpeedSampleRate', 10],["_setAllowAnchor", true], ["_setAllowLinker", true]);

//Rest of the file takes place in this closure. 
//The closure scopes jQuery or bQuery to the $ variable locally.
(function($) {
	window.ga_integration_config = window.ga_integration_config || {}; //Check for the ga_integration_config object globally; instantiate a local one if it's not set. 
	
	var analytics = {
		event : function(_args){
			var args;
			if(arguments.length === 1){
				args = _args; 
			}
			else{
				args = Array.prototype.slice.call(arguments, 0);
			}
			if(window._gaq){
				_gaq.push(["_trackEvent"].concat(args));
			}
			if(typeof ga === "function"){
				try{
					if(args[5] && args[5] === true){
						args[5] =  {'nonInteraction': 1};
					}
					ga.apply(this, ["send", "event"].concat(args));
				}
				catch(e){}
			}
		},
		social : function(){
			var args = Array.prototype.slice.call(arguments, 0);
			if(window._gaq){
				_gaq.push(["_trackSocial"].concat(args))
			}
			if(typeof ga === "function"){
				try{
					ga.apply(this, ["send", "social"].concat(args));
				}
				catch(e){}
			}
			
		},
		custom : function(){
			var args = Array.prototype.slice.call(arguments, 0);
			if(window._gaq){
				_gaq.push(["_setCustomVar"].concat(args).concat(2))
			}
			if(typeof ga === "function"){
				try{
					if( args[2] !== "false") {
						ga.apply(this, ["set", "dimension" + args[0], args[1] + args[2]  ] );	
					}
				}
				catch(e){}
			}
			
		},
		ecommerce : function(order_id, amount, sku, form, category){
			if(window._gaq){
				_gaq.push(['_addTrans', order_id, "", amount, '0', '0', "", "", ""], ['_addItem', order_id, sku, form, category, amount, '1'], ['_trackTrans']);
			}
			if(typeof ga === "function"){
				try{
					ga('require', 'ecommerce', 'ecommerce.js');
					ga('ecommerce:addTransaction', {
					  'id': order_id,
					  'affiliation': '',
					  'revenue': amount, 
					  'shipping': '0',  
					  'tax': '0' 
					});
					ga('ecommerce:addItem', {
					  'id': order_id, 
					  'name': form, 
					  'sku': sku,
					  'category': category,
					  'price': amount, 
					  'quantity': '1' 
					});
					ga('ecommerce:send');
				}
				catch(e){}
			}
		},
		queue : function(fn){
			if(window._gaq){
				_gaq.push(fn);
			}
			if(typeof ga === "function"){
				try{
					ga(fn);
				}
				catch(e){
					
				}
			}
		}
	}
		
	if(!ga_integration_config.cookiedomain){
		var slice = location.hostname.match(/\.uk$/) ? -3 : -2; //-3 for uk domains (foo.co.uk); -2 for regular domains (foo.com)
		ga_integration_config.cookiedomain = location.hostname.split(".").slice(slice).join(".");
	}
	
	/* window.onerror tracking: For JavaScript errors that do aren't caught and bubble to the window.
		window.onerror has better support than attaching an event
		so, to compensate, we backup any window.onerror function that might have already been set and execute it if it exists.
	*/
	
	var oldonerror = window.onerror;
	window.onerror = function(msg, url, line) {
		if (oldonerror) {
			oldonerror.apply(this, arguments );
		}
		analytics.event('JavaScript Errors', msg, url + '_' + line, 0, true);
	};

	/* UTILITY FUNCTIONS
			These are functions that are used internally by the script to simplify idioms.  
	*/


	/*
		getElem: This is a shortcut function for parsing a URL using the DOM.
		This allows you to quickly get the domain, pathname, etc off of a full URL.
	*/

	function getElem(href) {
		var target = document.createElement("a");
		target.href = href;
		return target;
	}

	/*
		proper: Simply capitalizes the first letter of a string. Useful for combining inconsistent data sources
	*/

	function proper(string) {
		return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}

	/*
		getPathname: A light wrapper for getElem (above) for directly getting the pathname
		This is just because of how frequently the social code gets the pathname. 
	*/

	function getPathname(href) {
		return href && getElem(href).pathname.replace(/(^\/?)/,"/"); //normalize the pathname, since IE omits the leading slash.
	}

	/* Shortest readCookie function imaginable */
	function readCookie(a){return(RegExp("(?:^|; )"+a+"=([^;]*)").exec(document.cookie)||[]).pop();}
	
	function createCookie(name,value,days) {
		if(ga_integration_config.nocookie){return;}
		var expires = days ? "; expires=" + (new Date(days*864E5 + (new Date()).getTime())).toGMTString()  :"";
		document.cookie = name+"="+value+expires+"; path=/; domain="+ga_integration_config.cookiedomain;
	}
	

	/* social_event: This is a wrapper over _gaq.push for tracking social actions using both _trackSocial and _trackEvent
		The reason for duplicating this data is that _trackSocial is still somewhat limited, and keeping both allows for more flexibilty when using the data.
	*/
	function social_event(net, action, url, path, val) {
		analytics.event(net, action, path, val);
		analytics.social(net, action, url, path);
	}
	
	/* Small hash computation function stolen from ga.js. Used internally. */
	function hash(d) {
		var a = 1,
			c = 0,
			h, o;
		if (d) {
			a = 0;
			for (h = d.length - 1; h >= 0; h--) {
				o = d.charCodeAt(h);
				a = (a << 6 & 268435455) + o + (o << 14);
				c = a & 266338304;
				a = c != 0 ? a ^ c >> 21 : a;
			}
		}
		return a;
	}
	
	/*
	This creates a map of the query string variables, a la PHP $_GET.
	So, ?foo=bar -> {"foo" : "bar"};, accessible as get.foo.
	*/

	var get = (function() {
		var map = {};
		location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, k, v) {
			map[k] = v;
		});
		return map;
	} ());
	
	
	/*
	CUSTOM VARIABLES
	1: Store the 'source' parameter
	2: Store the msid cookie, with optional deobfuscation if the msid_seed is set. 
	3: True/False as to if GUID cookie is set
	4: True/False as to if SPUD cookie is set
	5: Store the 'subsource' parameter. 
	*/
	if (get.source) {
		analytics.custom(1, 'Source', get.source);
	}
	if (get.subsource) {
		analytics.custom( 5, 'Subsource', get.subsource);
	}
	if (readCookie("msid")) {
		var msid = ga_integration_config.msid_seed ? ""+(parseInt(readCookie("msid"), 16)^ga_integration_config.msid_seed) : readCookie("msid");
		analytics.custom(2, 'msid', msid );
	}
	analytics.custom(3, 'Has GUID', "" + !!readCookie("guid") );
	analytics.custom(4, 'Has Spud', "" + !!readCookie("spud") );

	/*From here on, jQuery is required. Track if no jQuery, then throw an error*/
	if(!$ || !$.fn){
		throw new Error("No jQuery found.");
	}
	
	
	/*
		Analytics jQuery plugin. Acts as a wrapper for mousedown/keydown tracking to allow for unobtrusive click tracking, 
			By default, uses jQuery.fn.one to avoid duplicative data.
			Ex: 
				$("a#foo").analytics(function(){ _gaq.push(["_trackEvent", "Clicked", $(this).attr("href")]); });

			Comes with some syntactic sugar for easily passing specific GA Event or Optimizely data (though with no access to 'this')
				$("a#foo").analytics(["Category", "Action"]); //GA
				$("a#foo").analytics(["optimizely_goal"]) // Optimizely
				$("a#foo").analytics(["optimizely_revenue_goal", 400]);

			You can also override the event type and whether it uses one or "live".
	*/
	
	$.fn.analytics = function(param, custom, live) {
		if (!param) {
			return this.trigger(custom || "mousedown");
		}
		var event_string = custom ? custom + ".analytics" : "keydown.analytics mousedown.analytics";
		var func = live || "one";
		var callback = function(e) {
			if (custom || (e.type === "mousedown" || e.which === 13)) {
				if (typeof param === "function") {
					param.apply(this);
				} else {
					if ($.isArray(param) && param[1] && typeof param[1] !== "number") {
						analytics.event(param);
					} else if (typeof param === "string" || $.isArray(param)) {
						optimizely.push(["trackEvent"].concat(param));
					}
				}
			}
		};
		
		if(live && !$.fn.live){  // provide jQuery >=1.9 support
			return $(document).delegate(this.selector, event_string, callback);
		}
		return this[func](event_string, callback);
	};

	/*
			bsd_contrib_amt: Utility function for determining the contribution amount selected on the current page. Rounds to an integer.
			Not used in e-Commerce.
	*/

	function bsd_contrib_amt(m) {
		if (m.match(/contribution/i) && $("form#contribution").length) {
			var val = Math.round((!$('#amt_other:checked').length) ? $('input[name="amount"]:checked').val() : $('input[name="amount_other"]').val());
			return (val != val || Math.abs(val) > 1E9) ? 0 : val;
		}
		return 0;
	}

/* Completion and Contribution Tracking function*/

	function bsdtracker_to_ga(tracker){
		ga_integration_config.data.action = tracker;
		var type = tracker.modulename;
		if (type) {
			createCookie("_bsda_s",1,180);
			var form = tracker.formname;
			var amount = tracker.transaction_amt;
			if(tracker.savedPaymentInfo){ //if this a QD opt-in
				type = "Quick Donate Opt-In";
				createCookie("_bsda_q",1,180);
			}						
			else if (amount) { //this is a donation
				createCookie("_bsda_c",Math.round(amount), 180);
				var order_id = tracker.contribution_key; 
				var sku_end = $.inArray(amount, tracker.pageamounts) !== -1 ? Math.round(amount) : "other";
				var sku = tracker.contribution_page_id + "_" + sku_end;
				var pagetype = +tracker.pagetype; 
				var category = +tracker.is_recurring  ? "BSD Recurring" : "BSD";
				if(tracker.used_quick_donate){
					category += " Quick Donate";
					sku += "_QD";
					createCookie("_bsda_q",1, 180);
				}
				category += pagetype === 4 ? " Memberships" : pagetype === 2 ? " Tickets" : pagetype === 3 ? " Custom Contributions" : " Contributions";
				analytics.ecommerce(order_id, amount, sku, form, category);
				optimizely.push(["trackEvent", "bsdtracker", amount * 100]);
			}
			analytics.event('Completions', type, form, Math.ceil(amount||0)); //pass the completion event
			optimizely.push(["trackEvent", "bsdtracker_"+type]);
			
			
		}
	}


	/*
			Simple jQuery plugin for tracking validation errors using the presence of DOM Elements. 
			Ex:
				$(".error").registerBSDError("some-module");
				Will populate a GA non-interaction event upon the presence of a DOM element.
	*/

	$.fn.registerBSDError = function(module) {
		if (this.length) {
			analytics.event('Error', module, getPathname(document.referrer), bsd_contrib_amt(module), true);
		}
	};
	
	/* 
	Internal usage tracking. Runs once per session on 1% of traffic on a particular day of the week (fixed per domain) 
	Data logged in GAE app and viewable at http://bsd-analytics.appspot.com/admin
	*/
	if(hash(location.hostname)%7===(new Date).getDay() && Math.ceil(Math.random()*100)===1 && !readCookie('__bsdzh') ) {
		(new Image()).src = "//bsd-analytics.appspot.com/?" + $.param({hostname: location.hostname, src: $("script:last").attr("src"), jQ : $.fn.jquery});
	}

	/*Sharing is caring */
	ga_integration_config.util = {
		createCookie: createCookie, 
		readCookie: readCookie,
		getURLParam: get,
		hash: hash,
		contrib_amt: bsd_contrib_amt,
		bsdtracker_to_ga: bsdtracker_to_ga,
		getPathname: getPathname,
		social_event: social_event,
		proper: proper
	};
	ga_integration_config.data = {};

/* Everything from here on out takes place at doc ready or later. */
	$(document).ready(function() {
		
		/* Generic Pre Submit Tracking 
		It binds a single mousedown handler on submit buttons
		It binds a single keydown handler on the forms themselves.
		Requires separate event bindings for clicks to submit and "enter" to submit because mousedown on a form includes clicking into an element, and keydown on an input includes typing into an input. Manages its own unbinding because of the if() statement (since one() would unbind improperly)
		*/
		function track(e) {
		    if (e.type === "mousedown" || e.which === 13) {
		        $this = $(this);
		        $this.unbind("keydown mousedown", track);
		        var $form = $this.is("form") ? $this : $this.closest("form");
		        var form_id = $form.attr('id') || $form.attr('name') || $form.attr('action') || "(none)";
		        analytics.event('Form Submits', form_id, location.pathname, bsd_contrib_amt(form_id));
		    }
		}
		$('input').filter('[type="image"],[type="submit"]').bind("mousedown", track);
		$('form').bind("keydown", track);
		
		/*
			Instantiates usage of the $.fn.registerBSDError plugin for 3 common modules.
		*/
					
		$('span.signuperror').registerBSDError("Signup");
		$('div.contriberrorbanner').registerBSDError("Contribution");
		$('#invitationpage .error').registerBSDError("Share");

		/*
				External URL tracking. Utilizies analytics() plugin, and uses live()/delegate().
				For non social URLs, tracks the URL in an event.
				For social URLs, utilizes social event. 
				For Facebook sharer.php URLs, removes the facebook.com and preserves the shared URL. 
 		*/

		$("[href^='http'], [href^='//']").analytics(function(e) {
			if (this.hostname !== location.hostname) {
				var net = (/(facebook|twitter|addthis|youtube|pinterest)(\.com)/i).exec(this.href);
				if (net) {
					var dest = this.href.match(/facebook\.com\/sharer.php/) ?  decodeURIComponent(this.href.replace("http://www.facebook.com/sharer.php?u=", "")) : this.href;
					social_event(proper(net[1]), "click", dest, getPathname(dest));
				}
				else{
					analytics.event('Exits', getElem(this.href).hostname, this.href);		
				}
			}
		},
		null, "live");
		
		/*PDF Click tracking*/
		$('a[href$=".pdf"]').analytics(function(e){
			analytics.event('PDF Clicks', $(this).text(), this.href, 0, true);
		});
		/*HTML5 video/audio play/end/pause tracking*/
		$("video,audio").bind("play ended pause", function(e){
			analytics.event( proper(this.nodeName), proper(e.type), this.src, 0, true );
		});
		
		/* Cross-domain tracking plugin.*/
		$.fn._link = $.fn._link || function(domains, opt_base) {
			var domain = opt_base || location.hostname.split(".").slice(-2).join(".");
			this.one("click", function(e) {
				if (~$.inArray(domain, domains) && domain != this.hostname.split(".").slice(-2).join(".")) {
						$this = $(this);
						ga.queue(function(){
							$this.attr('href', function(i, old) {
								return _gat._getTrackerByName()._getLinkerUrl(old, true);
							});
							
						})
				}
			});
		};

		/* Run this section on thank you pages of modules that support BSD 
		*/
		/*
		Manages two code paths. First, if there's a BSDTracker object on the page
		If there's not, but the earlier if establishes that there's a td parameter in the URL, that means we're on a thank you page of a non-BSD page.
		Thus, hit the decoding endpoint, which will create the object, and run that tracking object through the above function.
		*/
		if(window.BSDTracker){
			var type = (BSDTracker.signup) ? "signup" : (BSDTracker.contribution) ? "contribution" : "";
			bsdtracker_to_ga(BSDTracker[type].jsonData);
		}
		else if(get.td){
			var decode_url = (ga_integration_config.bsddomain  ? ga_integration_config.bsddomain : "//tools.bluestatedigital.com") + "/page/tracking/action-decode?td="+ get.td + "&callback=?";
			$.getJSON(decode_url , function(tracker){
				 bsdtracker_to_ga(tracker);
			});
		}
		
		
		/*
		Tracking for Mailcheck on signup pages. 
		*/
		if(window.bQuery && bQuery.fn.mailcheck){
			$("#email").blur(function(){
				var mailcheck = $(".bsd-mailcheck");
				if(mailcheck.length){
					var domain = mailcheck.text();
					analytics.event("Mailcheck", "Shown", domain, 0, true);
					var callback = function(){
						analytics.event("Mailcheck", "Clicked", domain, 0, true);
					};
					if(!$.fn.live){ //For jQuery >=1.9, there's no live()
						$("#signup").delegate(".bsd-mailcheck a", "click", callback);
					}
					else{
						$(".bsd-mailcheck a").live("click", callback);
					}
				}				
			});
		}

	/*
	Rest of the code takes place at window.onload
	4-9-2018: update jQuery alias $(window).on('load', function{}) instead of .onload
	*/
		$(window).on('load', function() {
			
			/*Optimizely Experiment Tracking*/
			
			if (optimizely.variationNamesMap) {
			    var optmap = optimizely.variationNamesMap;
				$.each(optimizely.variationNamesMap, function(key,val){
					analytics.event("Optimizely", optimizely.allExperiments[key].name, val, 0, true);
				});
			}
			
			
			/* if guid set, if nospud and noloe aren't set to false, if loega cookie hasn't been set, AND if either a domain is configured or the path starts with /page/
			*/
			if(ga_integration_config.nocookie!==false && ga_integration_config.nospud!==false && ga_integration_config.noloe!==false && readCookie("guid") && !readCookie("loega") && (ga_integration_config.bsddomain || location.pathname.match(/^\/page\//)) ){
			    var domain = ga_integration_config.bsddomain || "";
			    $.getJSON(domain + '/page/graph/loe/' + readCookie("guid")+'?callback=?', function(LOE){
			        var enabled = [],
			            label="", hpc = 0,
			            engagement;
					ga_integration_config.data.loe = LOE;
			        /* Iterate over LOE object and grab rungs they've hit (true ones) */
			        for (var step in LOE) {
			            if (LOE[step] && typeof LOE[step] === "boolean") {
			                enabled.push(step);
			            }
			        }
			        //join alphabetized list of features by a -; if none are enabled, they're anonymous.
			        engagement = enabled.length ? enabled.sort().join("-") : "Anonymous";

			        if (LOE.donor) { /*Donor specific logic, to fetch days since their donation and tag what kind of donor they are */
			            hpc = Math.ceil(LOE.highest_previous_contribution);
						label = ""+hpc;
			            createCookie("_bsda_c",hpc,180);
			        }
			        if (LOE.email){
			            createCookie("_bsda_s",1,180);
			        }
					if (LOE.qd_enrolled){
						createCookie("_bsda_q",1,180);
					}

			        //Send engagement string as non-interaction event, with hpc as the value.
			        analytics.event("Ladder of Engagement", engagement, label, hpc, true);
			        //set a session cookie so that the logic only runs once per session.
					createCookie("loega", 1);
			    });
			}
			

			/*
			This closure encapsulates the GA UTMZ -> BSD Source integration
			*/
			(function() {
				if(ga_integration_config.nospud === true || ga_integration_config.nocookie === true){ //Exit if they've set 'nospud' on the config object
					return;
				}
				var utmz = readCookie('__utmz') || "";

				/*
				Only continue if:
				 - SPUD cookie isn't set AND source isn't set
				 - OR: utmz cookie is set, and the hash of the utmz cookie is different than the hash of the bsdzh cookie (ie, campaign info has changed)
				*/
				if ((!readCookie('spud') && !get.source  &&  !readCookie("source") ) || (utmz && hash(utmz).toString() !== readCookie('__bsdzh'))) {

					//SPUD JSONP endpoint, with optional bsddomain configuration
					var spudurl = (ga_integration_config.bsddomain  ? ga_integration_config.bsddomain : "") + "/page/spud?jsonp=?";
					
					var callback = function() {
						var arg = {};
						var pairs = utmz.split('.').slice(4).join('.').split('|'); //this isolates the campaign information peace of the utmz cookie, and then splits on | to make each array item a meaningful key=val pair. 
						var vals = {};
						$.each(pairs, function(i,v ){
							var temp = v.split("=");
							if(temp[1] && !temp[1].match(/^\(.*\)$/)){ //make sure value exists and it's not of the form (foo)
								vals[temp[0]] = decodeURIComponent(temp[1]);
							}
						});
						if (vals.utmgclid) { //Means it's google cpc.
							arg.source = 'cpc_google';
							arg.subsource = vals.utmctr;
						} 
						else {
							var subsource = [];
							$.each(vals, function(k,v){
								if(k!=="utmcmd" && k!=="utmcsr" && k!=="utmcct"){ //save all the values except source and medium and content
									subsource.push(v);
								}
							});
							if(vals.utmcmd && vals.utmcsr){
								arg.source =  vals.utmcmd + '_' + vals.utmcsr; //set source as medium_source
							}
							arg.subsource = subsource.sort().join('_'); //sets subsource as campaign_content_term, but excluding empty values.
						}
						
						/*Set source and subsource cookies if applicable*/
						if(get.source || arg.source){
							createCookie("source", get.source || arg.source, 7);							
						}
						if(get.subsource || arg.subsource){
							createCookie("subsource", get.subsource || arg.subsource, 7);
						}						
					}	;
				
					//set the bsdzh cookie with a hashed value of the utmz cookie, so this code section only runs once per session at most, unless the campaign changes.
					createCookie("__bsdzh", hash(utmz));
					if (readCookie('spud')) { //if spud is set, there's a risk source and subsource are already configured. If they aren't set, run callback()	
						$.ajax({url: spudurl ,dataType: "jsonp",data: {type: "getm",field: "source,subsource"},jsonp: "jsonp",
							success: function(old){
								if (!(old.source || old.subsource)) {
									callback();
								}
							}
						});
					} else { //no spud cookie means there's no risk of overwriting any existing values, since they aren't set.
						callback();
					}
				
				}
			})();
			
			/*
					SOCIAL PLUGIN TRACKING
					Social plugin tracking must be done at window.onload, otherwise it might bind the events too early.

					All events utilize social_event()

					To avoid repetitive code, instantiation of event listeners for Facebook and Twitter both use dynamically created functions.

					To account for the "unofficial" Twitter buttons that still utilize widgets.js (like used on the share page),
					the conditions check for both the official and unofficial when handling the event. 

			*/


			/*
				Facebook Tracking
				Checks for window.FB and FB.Event, which signify that the FB JS SDK is loaded and we can listen for events.
			*/
			if (window.FB && FB.Event) {
				FB.Event.subscribe('edge.create', function(response) {
					social_event("Facebook", "Like", response, getPathname(response), 1);
				});

				FB.Event.subscribe('edge.remove', function(response) {
					social_event("Facebook", "Unlike", response, getPathname(response), -1);
				});

				FB.Event.subscribe('comment.create', function(response) {
					social_event("Facebook", "Comment", response.href, getPathname(response.href), 1);
				});
				FB.Event.subscribe('comment.remove', function(response) {
					social_event("Facebook", "Uncomment", response.href, getPathname(response.href), -1);
				});
			}

			/*Checking for the existence of the Twitter Intents JS SDK. Will exist on pages that load widgets.js*/
			
			if (window.twttr && twttr.events && twttr.ready) {
				twttr.ready(function(twttr){ //Wrap on twttr.ready for async compatibility. 
					/*
						Twitter Tracking
						Create Twitter events for clicks, tweets, RTs, Follows and Favorites.
						Uses an iterator to avoid repetitive code. 
					*/
					
				'click tweet retweet follow favorite'.replace(/\w+/g, function(n) { //don't ask why i use this .replace() hack as a forEach replacement 
					twttr.events.bind(n, function(intent) {
						var target;
			            if (intent && intent.target) {
			                if (intent.target.src) {
			                    target = getElem(decodeURIComponent((intent.target.src.match(/[&#?](url=)([^&]*)/)||[""]).pop()));
			                }
				            else if (intent && intent.target && intent.target.href) {
				                $.each(decodeURIComponent(intent.target.search).replace(/\+/g, " ").split(/&| |\=/g), function(i, v) {
				                if (v.match(/(^https?:\/\/)|(^www.)/)) {
				                      target = getElem(v);
				                      return false;
				                 	}
				                 });
				            }
						}
						if(target){
							social_event("Twitter", intent.type, target.href.replace(target.hash, ""), target.pathname);
						}
					});
				});
			});
			}
		});
	});
})(window.jQuery||window.bQuery);
