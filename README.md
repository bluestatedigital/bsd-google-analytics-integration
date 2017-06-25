Blue State Digital Google Analytics Integration Script
================================

Google Analytics Integration library for use on sites that use the BSD Tools, developed by Blue State Digital agency employees, and available for public use under the Apache 2 license. 

<h1>Installation</h1>
In order to correctly install the `ga_integration-min.js` snippet, you need to break the standard Google Analytics snippet in half. This is so that the custom variables set in the script set before the pageview, but after the tracker is created. 

```html
	<!-- START Google Analytics -->
	<script>
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
	ga('create', '<!--place id here-->', 'auto', {'allowLinker': true, 'siteSpeedSampleRate': 20});
	ga('require', 'linker');
	//See https://github.com/bluestatedigital/bsd-google-analytics-integration#configuration for configuration options
	var ga_integration_config={};
	</script>
	<script src="//s.bsd.net/bsdaction/default/page/-/js/analytics/ga_integration-min.js"></script>
	<script>
	ga('send', 'pageview');
	</script>
	<!-- END Google Analytics -->
```

<h1>Features</h1>

<h3>E-Commerce</h3>
All contributions are tracked by default as e-commerce transactions, with the product name set to the form name and the category set to the type of contribution. Different types include the various combinations of Recurring, Quick Donate, and Ticket-based contributions. 

For E-Commerce tracking to work consistently across all Tools page types, you should have "Enable Tracking" set to "Yes" on all donation pages.

<h3>GA Event Categories</h3>
- Completions: Tracks completed BSD Actions in the case of signups, ecommerce and quick-donate opt-in. The ecommerce event is duplicative of the E-Commerce module data, but is less accurate because the associated values are rounded.
- File Clicks: tracks clicks on files with the the `file_extensions` configuration attribute (see below). If no extensions are specified, will only track clicks on pdfs.
- Form Submits: Tracks all form submits, regardless of the outcome.
- Errors: Validation errors in Signup, Contribution and Share.
- Error Log: JavaScript Errors
- Exits: Clicks on links to a different domain
- Mailcheck: catches mis-spelled email addresses
- Duplication of the Social Events
- Tests: Data from our Optimizely experiments running on the page


<h3>Social Tracking</h3>
By default, the following things, when properly configured, are automatically tracked as social tracking and duplicated to event tracking:
- Facebook Likes, Clicks to Facebook Shares, and Clicks to Facebook
- All Twitter intents events, including callbacks for completed tweets and follows. 
- External clicks to Pinterest, Facebook, Twitter and YouTube. 

<h3>Custom Variables</h3>
1. Source: Captures the value of a ?source parameter in the URL
2. msid: Grabs the obfuscated mailing_send_id cookie when it's available. This can be decoded by the analytics team and made to associate traffic with a particular mailing (in the absence of proper tagging)
3. Has GUID: Tags whether a visitor has a guid cookie at the start of their visit. 
4. Has SPUD:Tags whether a visitor has a spud cookie at the start of their visit. 
5. Subsource: Captures the value of a ?subsource parameter in the URL

<h3>Traffic Source Integration</h3>
For any visit where this is no source or subsource set, parses the traffic source information available from the Google Analytics cookie.
- Sets 'BSD source' to medium_source
- Sets BSD subsource to campaign_content_term, when available.

<h2>Configuration</h2>

The behvaior of the library can be configured by the `ga_integration_config` global object.

The configuration attributes are:

 - `bsddomain` - Set to one of the bsd subdomains (e.g. `https://donate.domain.org`, or `//donate-domain.org`) for the purposes of grabbing LOE information or loading the SPUD script. To avoid mixed content errors, this domain should support HTTPS.
 - `cookiedomain` - if this isn't set manually, the library will just use the `location.hostname.split` method used in the above snippet on the `_setDomainName` call to grab the current domain.
 - `nocookie` - Set to `true` if you want to prevent the library from using cookies. This disables any of the tracking features that rely on cookies. 
 - `msid_seed` - passes the actual `mailing_send_id` instead of the obfuscated `mailing_send_id` that is set by default on the mailing cookie. Should always set it if we can, especially for sites using the BSD mailer. Contact BSD to find out this value. 
 - `nospud` - Set to `true` to disable SPUD features. (Default: `false`)
 - `noloe` - Set to `true` to disable LOE usage. (Default: `false`)
 - `file_extensions` - tracks clicks on files with extensions matching a pipe-separated list. If no extensions are specified, will only track clicks on pdfs. You can disable all file click tracking by setting file_extension to an empty string.

Example:

```javascript
var ga_integration_config = {
  bsdomain: "//secure-domain.client.com",
  msid_seed: 9023328,
  noloe: true,
  file_extensions: '.pdf|.docx|.pptx|.zip'
}
````
