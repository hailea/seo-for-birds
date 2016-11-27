/*******************************************************************************************
  Module:		main
  Description:	- Main contentScript for directly interacting with the page's DOM.
                - Every tab has its own instance of this script.
                - Page content (DOM) can only be modified/accessed from within the content script
/*******************************************************************************************
  Property of:	Webroot Inc.
  Copyright:	Webroot Inc. (c) 2016
/*******************************************************************************************
  Creator:		melsaie@webroot.com
  Manager:		pblaimschein@webroot.com
  Created:		02/10/2016 (mm/dd/yyyy)
********************************************************************************************/

// IFDEF EDGE
if (Webroot_Browser.identify_browser() == Webroot_Browser.EDGE) chrome = browser;

// ---------------------------- //
//   Webroot_Extension Object   //
// ---------------------------- //
var Webroot_Extension =
{
    // Initialize User Preferences
    urlBlocking: 0,
    phishBlocking: 0,
    searchAnnotation: 1,
    agentPwd: 0,
    chromeVersion: 1,
    newProtocol: 1,
    useDevPortal: 0,

    // Initialize Rules
    SRA_DATE: '',				// Init annotaionFile date
    SRA_DATE_DEFAULT: "Mon, 14 Mar 2016 17:54:42 GMT",
    SRA_CONFIG_DEFAULT: JSON.parse('[{ "domain":"", "elem":"a", "eid":"", "eclass":"", "parent":"h3", "pid":"", "pclass":"r", "prefix":"", "postfix":"", "encode":"", "regex":".*www\\\\.google\\\\..*" }, { "domain":"", "elem":"a", "eid":"", "eclass":"", "parent":"li", "pid":"", "pclass":"b_algo", "prefix":"", "postfix":"", "encode":"", "regex":".*bing\\\\.com.*" }, { "domain":"", "elem":"a", "eid":"", "eclass":"", "parent":"h3", "pid":"", "pclass":"", "prefix":"", "postfix":"", "encode":"", "regex":".*bing\\\\.com.*" }, { "domain":"", "elem":"a", "eid":"", "eclass":"", "parent":"h3", "pid":"", "pclass":"title", "prefix":"/RU=", "postfix":"/R", "encode":"URL", "regex":".*search\\\\.yahoo\\\\.com.*" }, { "domain":"", "elem":"a", "eid":"", "eclass":" ac-algo ac-21th", "parent":"h3", "pid":"", "pclass":"title", "prefix":"/RU=", "postfix":"/R", "encode":"URL", "regex":".*search\\\\.yahoo\\\\.com.*" }, { "domain":"", "elem":"a", "eid":"", "eclass":" td-u", "parent":"h3", "pid":"", "pclass":"title", "prefix":"/RU=", "postfix":"/R", "encode":"URL", "regex":".*search\\\\.yahoo\\\\.com.*" }, { "domain":"", "elem":"a", "eid":"", "eclass":" td-u", "parent":"h3", "pid":"", "pclass":"", "prefix":"/RU=", "postfix":"/R", "encode":"URL", "regex":".+search\\\\.yahoo\\\\.com.*" }, { "domain":"", "elem":"a", "eid":"", "eclass":"", "parent":"h3", "pid":"", "pclass":"", "prefix":"", "postfix":"", "encode":"", "regex":".*search\\\\.yahoo\\\\.co\\\\..*" }]'),
    SRA_CONFIG: '',

    // Create Categories Array
    brightCloudCat: ["Uncategorized", "Real_Estate", "Computer_and_Internet_Security", "Financial_Services",
				    "Business_and_Economy", "Computer_and_Internet_Info", "Auctions", "Shopping", "Cult_and_Occult",
				    "Travel", "Abused_Drugs", "Adult_and_Pornography", "Home_and_Garden", "Military", "Social_Networking",
				    "Dead_Sites", "Individual_Stock_Advice_and_Tools", "Training_and_Tools", "Dating",
				    "Sex_Education", "Religion", "Entertainment_and_Arts", "Personal_sites_and_Blogs", "Legal",
				    "Local_Information", "Streaming_Media", "Job_Search", "Gambling", "Translation",
				    "Reference_and_Research", "Shareware_and_Freeware", "Peer_to_Peer", "Marijuana", "Hacking",
				    "Games", "Philosophy_and_Political_Advocacy", "Weapons", "Pay_to_Surf", "Hunting_and_Fishing",
				    "Society", "Educational_Institutions", "Online_Greeting_Cards", "Sports", "Swimsuits_Intimate_Apparel",
				    "Questionable", "Kids", "Hate_and_Racism", "Personal_Storage", "Violence",
				    "Keyloggers_and_Monitoring", "Search_Engines", "Internet_Portals", "Web_Advertisements", "Cheating",
				    "Gross", "Web_based_email", "Malware_Sites", "Phishing_and_Other_Frauds",
				    "Proxy_Avoidance_and_Anonymizers", "Spyware_and_Adware", "Music", "Government", "Nudity",
				    "News_and_Media", "Illegal", "Content_Delivery_Networks", "Internet_Communications",
				    "Bot_Nets", "Abortion", "Health_and_Medicine", "Confirmed_SPAM_Sources", "SPAM_URLs",
				    "Unconfirmed_SPAM_Sources", "Open_HTTP_Proxies", "Dynamically_Generated_Content", "Parked_Domains",
				    "Alcohol_and_Tobacco", "Private_IP_Addresses", "Image_and_Video_Search", "Fashion_and_Beauty",
				    "Recreation_and_Hobbies", "Motor_Vehicles", "Web_Hosting"],

    serverPath: '',
    prodServerPath: 'https://wf.webrootanywhere.com/Content/',
    devServerPath: 'http://development-env.elasticbeanstalk.com/Content/',
    blockPagePath: 'http://wf.webrootanywhere.com/ConsumerBlockpage.aspx',
    errorPagePath: 'http://wf.webrootanywhere.com/ErrorPages/Oops.aspx',
    whitePagePath: 'http://wf.webrootanywhere.com/WebFiltering/WhiteList.html',
    devBlockPagePath: 'http://development-env.elasticbeanstalk.com/consumerblockpage.aspx',
    devWhitePagePath: 'http://development-env.elasticbeanstalk.com/WebFiltering/WhiteList.html',
    devErrorPagePath: 'http://development-env.elasticbeanstalk.com/ErrorPages/Oops.aspx',

    // Define PP limit (1MB)
    RTAP_BYTE_SIZE: 1000000,

    // Create Array of MyObjects (GLOBAL)
    links: new Array(),		// <A> TAGS
    frameSrc: new Array(),		// <IFrame> Tags

    // ---------------------------------- //
    //     Initialization function        //
    // ---------------------------------- //
    init: function () {
        // Run extension ONLY on WIN platform
        var OSName = "Unknown OS";
        if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
        if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
        if (OSName == "MacOS") exit();

        Webroot_Extension.SRA_DATE = Webroot_Extension.SRA_DATE_DEFAULT;
        Webroot_Extension.SRA_CONFIG = Webroot_Extension.SRA_CONFIG_DEFAULT;
        Webroot_Extension.serverPath = Webroot_Extension.prodServerPath;

        // ---------------------------------- //
        // Grab User Preferences from Service //
        // ---------------------------------- //
        chrome.runtime.sendMessage({ msg: "config" }, function (response) {
            // Handle Config Response
            Webroot_Extension.handleConfigResponse(response);

            // Add OnDocumentComplete event listener
            $(document).ready(Webroot_Extension.onDomAvailable);

            // Add OnMouseHover event listener
            $(document.body).mouseover(Webroot_Extension.onHover);
        });
    },

    // ---------------------------------- //
    // OnDocumentComplete event listener  //
    // ---------------------------------- //
    onDomAvailable: function () {
        // Get current URL
        var url = document.URL;

        // Check if NewTab URL
        if (Webroot_Helper.isNewTabPage(url)) return;

        // Update BrowserAction if BlockPage
        if (Webroot_Helper.isBlockPageUrl(url)) chrome.runtime.sendMessage({ msg: "update_browseraction_icon", data: "BLOCK_PAGE" }, function (response) { });

        // Check for Content Script Filtered URL's
        if (Webroot_Helper.isContentScriptFilteredUrl(url)) return false;

        // Check for WhiteList URL's
        if (Webroot_Helper.isWhiteListUrl(url, Webroot_Extension.useDevPortal)) {
            chrome.runtime.sendMessage({ msg: "whiteList", ppURL: url }, function (response) {
                // Navigate to WhiteListed URL
                if (response.responseText != 0) window.location = response.responseText;
            });
            return 0;
        }

        // Extract URL Info
        var myURI = Webroot_Helper.parseUri(url);

        // Check if domain on list of supported search engines
        var domainCount = Webroot_Extension.supportedSearchEngine(url);

        // Get Body content	
        var body = document.getElementsByTagName("body")[0];

        // Perform Search Result Annotation Processing if required
        if (Webroot_Extension.searchAnnotation == 1 && domainCount != -1) {
            // Update BrowserAction if SearchEngine
            chrome.runtime.sendMessage({ msg: "update_browseraction_icon", data: "SEARCH_ENGINE" }, function (response) { });

            // Process Search Engine Page
            Webroot_Extension.processSearchPage(body, "DOCUMENTCOMPLETE", domainCount);

            return 0;
        }

        // Check if URL is below the browser length limit
        if (url.length > 64000) return 0;

        // Perform URL BCAP request
        if (Webroot_Extension.urlBlocking == 1) {
            // Classify URL
            chrome.runtime.sendMessage({ msg: "classifySingle_Async", ppURL: url }, function (response) {
                // Handle BCAP Response
                if (Webroot_Extension.handleBcapResponse(response)) {
                    // Update BrowserAction if connection failed
                    chrome.runtime.sendMessage({ msg: "update_browseraction_icon", data: "ERROR" }, function (response) { });
                    return true;
                }

                // Update BrowserAction icon
                chrome.runtime.sendMessage({ msg: "update_browseraction_icon", data: response.responseText }, function (response) { });

                // Use JSON Parser
                var ResponseObj = JSON.parse(response.responseText);

                // Check if Local page site
                if (ResponseObj.DATA[0].NOPP == 1 || ResponseObj.DATA[0].PRIVATEIP == 1) return 0;

                // Perform PhreshPhish check
                if (Webroot_Extension.phishBlocking == 1) {
                    // Get Root Document HTML
                    var RootHTML = Webroot_Helper.extractPageHtml(document);

                    // Check size of extracted document
                    if (Webroot_Helper.getByteLen(RootHTML) > Webroot_Extension.RTAP_BYTE_SIZE) return 0;

                    // Send PhreshPhish request
                    chrome.runtime.sendMessage({ msg: "phreshPhish", ppURL: url, RootHTML: RootHTML }, function (response) {
                        // Handle PhreshPhish response
                        Webroot_Extension.handlePhreshPhishResponse(response);
                        return true;
                    });
                }
                return 0;
            });
        }
        else {
            // Perform PhreshPhish check
            if (Webroot_Extension.phishBlocking == 1) {
                // Get Root Document HTML
                var RootHTML = Webroot_Helper.extractPageHtml(document);

                // Check size of extracted document
                if (Webroot_Helper.getByteLen(RootHTML) > Webroot_Extension.RTAP_BYTE_SIZE) return 0;

                // Send PhreshPhish request
                chrome.runtime.sendMessage({ msg: "phreshPhish", ppURL: url, RootHTML: RootHTML }, function (response) {
                    // Handle PhreshPhish response
                    Webroot_Extension.handlePhreshPhishResponse(response);
                    return true;
                });
            }
        }
    },

    // ---------------------------------- //
    // OnMouseHover event listener        //
    // ---------------------------------- //
    onHover: function () {
        // Get current URL
        var url = document.URL;

        if (!Webroot_Helper.isDynamicSearchEngine(url)) return 0;

        // Check for Content Script Filtered URL's
        if (Webroot_Helper.isContentScriptFilteredUrl(url)) return false;

        // Extract URL Info
        var myURI = Webroot_Helper.parseUri(url);

        // Check if domain on list of supported search engines
        var domainCount = Webroot_Extension.supportedSearchEngine(url);

        // Get Body content	
        var body = document.getElementsByTagName("body")[0];

        // Perform Search Result Annotation Processing if required
        if (Webroot_Extension.searchAnnotation == 1 && domainCount != -1) {
            // Process Search Engine Page
            Webroot_Extension.processSearchPage(body, "ONHOVER", domainCount);

            return 0;
        }
    },

    // -------------------------------------- //
    //		 Check if current domain	  	  //
    //       is a supported search engine	  //
    // -------------------------------------- //	
    supportedSearchEngine: function (myDomain) {
        // Check if new Config file is loaded
        if (Webroot_Extension.SRA_CONFIG[0].regex == null) return -1;

        // Check if domain on list of supported search engines
        var domainCount = [];
        var arrIndex = 0;
        for (var uriCount = 0; uriCount < Webroot_Extension.SRA_CONFIG.length; uriCount++) {
            // Extract RegEx from Config File
            var newRegEx = new RegExp(Webroot_Extension.SRA_CONFIG[uriCount].regex, 'i');

            // Check URL against RegEx
            var result = myDomain.match(newRegEx);

            //if ( myDomain == SRA_CONFIG[uriCount].domain )
            if (result != null) {
                domainCount[arrIndex] = uriCount;
                arrIndex++;
            }
        }
        if (domainCount.length == 0) return -1;
        else return domainCount;
    },

    // --------------------------------------- //
    // Add Reputation Icon based on Reputation //
    // Reputation Scores Received from Server  //
    // --------------------------------------- //
    add_icon_bulk: function (rep, index, msg) {

        var toolTip = null;
        var innerHtml = null;
        var blockedCat = false;

        // Get Categories
        var obj = JSON.parse(msg);

        for (var i = 0; i < obj.DATA[index]["CAT.CONF"].length; i++) {
            var splitResult1 = obj.DATA[index]["CAT.CONF"][i].split('.')[0];

            if (splitResult1 == "49" || splitResult1 == "56" || splitResult1 == "57") {
                blockedCat = true;
                toolTip = chrome.i18n.getMessage("toolTip_1_A") + " " + chrome.i18n.getMessage(Webroot_Extension.brightCloudCat[splitResult1]) + " " + chrome.i18n.getMessage("toolTip_1_C") + "\n";
                break;
            }
        }
        if (toolTip == null) toolTip = chrome.i18n.getMessage("toolTip_1_B") + " ";

        // Check if element ID was previously created
        var id = -1;
        var checkId = index;
        while (id == -1) {
            var elementID = "WebrootDivSpan" + checkId;
            if (document.getElementById(elementID) == null) id = checkId;
            else checkId++;
        }

        if (blockedCat || obj.DATA[index].RTAP == "-1") {
            var imgURL = Webroot_Extension.serverPath + "images/v2/StopSm.png";
            toolTip += chrome.i18n.getMessage("toolTip_2_A");
            innerHtml = "<img src='" + imgURL + "' /> ";
            innerHtml += '<span id="WebrootDivSpan' + id + '" class="red" style="border-radius: 5px; display: inline; position: absolute; font-family: arial, sans-serif; font-size: 12px; font-weight: normal; line-height: 14.3999996185303px; width: 330px; z-index: 99; white-space: normal; visibility: hidden;"><div class="webrootlogotitle"><img src="' + Webroot_Extension.serverPath + 'images/v2/logo_webroot.png" /><p> -  ' + chrome.i18n.getMessage("toolTip_3_E") + '</p></div><div class="webrootlogobody">' + toolTip + '</div></span>';
        }
        else {
            // Check reputation
            if (rep >= 81) {
                var imgURL = Webroot_Extension.serverPath + "images/v2/GoSm1.png";
                toolTip += chrome.i18n.getMessage("toolTip_2_E");
                innerHtml = "<img src='" + imgURL + "' /> "
                innerHtml += '<span id="WebrootDivSpan' + id + '" class="green" style="border-radius: 5px; display: inline; position: absolute; font-family: arial, sans-serif; font-size: 12px; font-weight: normal; line-height: 14.3999996185303px; width: 330px; z-index: 99; white-space: normal; visibility: hidden;"><div class="webrootlogotitle"><img src="' + Webroot_Extension.serverPath + 'images/v2/logo_webroot.png" /><p> -  ' + chrome.i18n.getMessage("toolTip_3_A") + '</p></div><div class="webrootlogobody">' + toolTip + '</div></span>';
            }
            else if (rep >= 61 && rep <= 80) {
                var imgURL = Webroot_Extension.serverPath + "images/v2/GoLtSm.png";
                toolTip += chrome.i18n.getMessage("toolTip_2_D");
                innerHtml = "<img src='" + imgURL + "' /> ";
                innerHtml += '<span id="WebrootDivSpan' + id + '" class="lightgreen" style="border-radius: 5px; display: inline; position: absolute; font-family: arial, sans-serif; font-size: 12px; font-weight: normal; line-height: 14.3999996185303px; width: 330px; z-index: 99; white-space: normal; visibility: hidden;"><div class="webrootlogotitle"><img src="' + Webroot_Extension.serverPath + 'images/v2/logo_webroot.png" /><p> -  ' + chrome.i18n.getMessage("toolTip_3_B") + '</p></div><div class="webrootlogobody">' + toolTip + '</div></span>';
            }
            else if (rep >= 41 && rep <= 60) {
                var imgURL = Webroot_Extension.serverPath + "images/v2/YieldSm.png";
                toolTip += chrome.i18n.getMessage("toolTip_2_C");
                innerHtml = "<img src='" + imgURL + "' /> ";
                innerHtml += '<span id="WebrootDivSpan' + id + '" class="yellow" style="border-radius: 5px; display: inline; position: absolute; font-family: arial, sans-serif; font-size: 12px; font-weight: normal; line-height: 14.3999996185303px; width: 330px; z-index: 99; white-space: normal; visibility: hidden;"><div class="webrootlogotitle"><img src="' + Webroot_Extension.serverPath + 'images/v2/logo_webroot.png" /><p> -  ' + chrome.i18n.getMessage("toolTip_3_C") + '</p></div><div class="webrootlogobody">' + toolTip + '</div></span>';
            }
            else if (rep >= 21 && rep <= 40) {
                var imgURL = Webroot_Extension.serverPath + "images/v2/YieldDkSm.png";
                toolTip += chrome.i18n.getMessage("toolTip_2_B");
                innerHtml = "<img src='" + imgURL + "' /> ";
                innerHtml += '<span id="WebrootDivSpan' + id + '" class="orange" style="border-radius: 5px; display: inline; position: absolute; font-family: arial, sans-serif; font-size: 12px; font-weight: normal; line-height: 14.3999996185303px; width: 330px; z-index: 99; white-space: normal; visibility: hidden;"><div class="webrootlogotitle"><img src="' + Webroot_Extension.serverPath + 'images/v2/logo_webroot.png" /><p> -  ' + chrome.i18n.getMessage("toolTip_3_D") + '</p></div><div class="webrootlogobody">' + toolTip + '</div></span>';
            }
            else if (rep >= 1 && rep <= 20) {
                var imgURL = Webroot_Extension.serverPath + "images/v2/StopSm.png";
                toolTip += chrome.i18n.getMessage("toolTip_2_A");
                innerHtml = "<img src='" + imgURL + "' /> ";
                innerHtml += '<span id="WebrootDivSpan' + id + '" class="red" style="border-radius: 5px; display: inline; position: absolute; font-family: arial, sans-serif; font-size: 12px; font-weight: normal; line-height: 14.3999996185303px; width: 330px; z-index: 99; white-space: normal; visibility: hidden;"><div class="webrootlogotitle"><img src="' + Webroot_Extension.serverPath + 'images/v2/logo_webroot.png" /><p> -  ' + chrome.i18n.getMessage("toolTip_3_E") + '</p></div><div class="webrootlogobody">' + toolTip + '</div></span>';
            }
            else {
                var imgURL = Webroot_Extension.serverPath + "images/v2/YieldDkSm.png";
                toolTip += chrome.i18n.getMessage("toolTip_2_B");
                innerHtml = "<img src='" + imgURL + "' /> ";
                innerHtml += '<span id="WebrootDivSpan' + id + '" class="orange" style="border-radius: 5px; display: inline; position: absolute; font-family: arial, sans-serif; font-size: 12px; font-weight: normal; line-height: 14.3999996185303px; width: 330px; z-index: 99; white-space: normal; visibility: hidden;"><div class="webrootlogotitle"><img src="' + Webroot_Extension.serverPath + 'images/v2/logo_webroot.png" /><p> -  ' + chrome.i18n.getMessage("toolTip_3_D") + '</p></div><div class="webrootlogobody">' + toolTip + '</div></span>';
            }
        }

        // Create encapsulating <div> element
        var newNode = document.createElement('div');
        newNode.id = "WebrootDiv";
        newNode.setAttribute("onmouseover", "document.getElementById('WebrootDivSpan" + id + "').style.visibility='visible';");
        newNode.setAttribute("onmouseleave", "document.getElementById('WebrootDivSpan" + id + "').style.visibility='hidden';");
        newNode.setAttribute("style", "display:inline");

        newNode.innerHTML = innerHtml;
        return newNode.outerHTML;
    },

    // ---------------------------------------- //
    // Object carrying reference to DOM  		//
    // element to be modified when BrightCloud  //
    // API replies								//
    // ---------------------------------------- //
    myobject: function (o) {
        this.myElement = o;
    },

    // ---------------------------- //
    // 	  UPDATE Search Results  	//
    // ---------------------------- //
    updateSearchResult: function (msg) {
        var responseMsg = '';

        // Receive Response
        if (msg != '')
            responseMsg = msg;

        if (responseMsg != '') {
            // Use JSON Parser
            var obj = JSON.parse(responseMsg);

            var myVersion = obj.VER;	//get VERSION
            var myOperation = obj.OP; 	//get OPERATION
            var myError = obj.ERR; 		//get Error

            // Check For Errors
            if (myError != 0) {
                Webroot_Extension.removeLoadingIconsGray();
                Webroot_Extension.links.length = 0;
                return myError;
            }

            // Add <style> tag to Page <head>
            var newStyleNode = document.createElement('style');
            newStyleNode.id = "webrootStyle";
            newStyleNode.innerHTML = '.compTitle{overflow:visible !important;} 			.WebrootDiv{cursor: help;position: relative;} 			.green{background:#eeeeee;border: 2px solid #408740;color:#333333;} 			.lightgreen{background:#eeeeee;border: 2px solid #62a70f;color:#333333;} 			.yellow{background:#fff4dd;border: 2px solid #ffb81d;color:#333333;} 			.orange{background:#ffe9db;border: 2px solid #ff6d10;color:#333333;} 			.red{background:#fbdcdc;border: 2px solid #e51313;color:#333333;} 			.webrootlogotitle{margin:10px 13px 5px 13px;} 			.webrootlogobody{margin:5px 10px 10px 13px;} 			.webrootlogotitle p{display:inline; line-height:100%; font-weight: bold;}';
            document.head.appendChild(newStyleNode);

            // Get URL'S Count
            var urlCount = obj.DATA.length;

            // Traverse Entrie URL's
            for (var i = 0; i < urlCount; i++) {
                // Get Reference
                var myRef = obj.DATA[i].REF;

                // Get results
                var innerHtml = Webroot_Extension.add_icon_bulk(obj.DATA[i].BCRI, i, responseMsg);

                // Create New <div> Tag
                var newNode = document.createElement('div');
                newNode.setAttribute("style", "display:inline;");
                newNode.innerHTML = innerHtml;

                // Remove Grey Image
                var webrootDiv = Webroot_Extension.links[myRef - 1].myElement.childNodes[0];

                if (webrootDiv.id == "WebrootProcessing")
                    webrootDiv.innerHTML = "";

                // Add HTML element to Current Node
                Webroot_Extension.links[myRef - 1].myElement.insertBefore(newNode, Webroot_Extension.links[myRef - 1].myElement.childNodes[0]);
            }
        }
        Webroot_Extension.links.length = 0;
    },

    // ---------------------------- //
    // 	  REMOVE Loading Icons  	//
    // ---------------------------- //
    removeLoadingIconsBlank: function () {
        // Traverse Entrie Search Results
        for (var i = 0; i < Webroot_Extension.links.length; i++) {
            // Remove Loading Icons
            var webrootDiv = Webroot_Extension.links[i].myElement.childNodes[0];

            if (webrootDiv.id == "WebrootProcessing") {
                // Add Connection Broken Icon
                webrootDiv.innerHTML = "";
            }
        }
    },

    // -------------------------------- //
    // 	  REMOVE Loading Icons  	    //
    //    and replace with gray icon    //
    // -------------------------------- //
    removeLoadingIconsGray: function () {
        // Traverse Entrie Search Results
        for (var i = 0; i < Webroot_Extension.links.length; i++) {
            // Remove Loading Icons
            var webrootDiv = Webroot_Extension.links[i].myElement.childNodes[0];

            if (webrootDiv.id == "WebrootProcessing") {
                // Add Connection Broken Icon
                webrootDiv.innerHTML = "<img src='" + Webroot_Extension.serverPath + "images/v2/bolt.png" + "' title='" + chrome.i18n.getMessage('serverUnAvailable') + "' /> ";
            }
        }
        Webroot_Extension.links.length = 0;
    },

    // -------------------------------------------------------- //
    // Recieve user settings and store them in global variables //
    // -------------------------------------------------------- //
    handleConfigResponse: function (response) {
        if (response.responseText == 0) {
            Webroot_Extension.urlBlocking = 0;
            Webroot_Extension.phishBlocking = 0;
            Webroot_Extension.searchAnnotation = 1;
            Webroot_Extension.agentPwd = 0;
            Webroot_Extension.chromeVersion = 1;
            Webroot_Extension.newProtocol = 0;
            Webroot_Extension.useDevPortal = 0;
            Webroot_Extension.SRA_DATE = Webroot_Extension.SRA_DATE_DEFAULT;
            Webroot_Extension.SRA_CONFIG = Webroot_Extension.SRA_CONFIG_DEFAULT;
        }
        else if (response.responseText == 1062) {
            Webroot_Extension.urlBlocking = 0;
            Webroot_Extension.phishBlocking = 0;
            Webroot_Extension.searchAnnotation = 0;
            Webroot_Extension.agentPwd = 0;
            Webroot_Extension.chromeVersion = 1;
            Webroot_Extension.newProtocol = 0;
            Webroot_Extension.useDevPortal = 0;
            Webroot_Extension.SRA_DATE = Webroot_Extension.SRA_DATE_DEFAULT;
            Webroot_Extension.SRA_CONFIG = Webroot_Extension.SRA_CONFIG_DEFAULT;
        }
        else {
            var obj = response.responseText;

            // Check For Errors
            if (obj.ERR != 0) {
                Webroot_Extension.urlBlocking = 0;
                Webroot_Extension.phishBlocking = 0;
                Webroot_Extension.searchAnnotation = 1;
                Webroot_Extension.agentPwd = 0;
                Webroot_Extension.chromeVersion = 1;
                Webroot_Extension.newProtocol = 0;
                Webroot_Extension.useDevPortal = 0;
                Webroot_Extension.SRA_DATE = Webroot_Extension.SRA_DATE_DEFAULT;
                Webroot_Extension.SRA_CONFIG = Webroot_Extension.SRA_CONFIG_DEFAULT;
            }
            else if (obj.VER == Webroot_Extension.chromeVersion) {
                Webroot_Extension.urlBlocking = obj.DATA[0].URLBlocking;				//get URLBlocking flag
                Webroot_Extension.phishBlocking = obj.DATA[0].PhishBlocking; 			//get PhishBlocking flag
                Webroot_Extension.searchAnnotation = obj.DATA[0].SearchAnnotation; 	//get SearchAnnotation flag
                Webroot_Extension.agentPwd = obj.DATA[0].AgentPwd; 					//get PasswordCheck flag

                if (obj.DATA[0].WFVersion) Webroot_Extension.newProtocol = 1;
                else Webroot_Extension.newProtocol = 0;

                if (obj.DATA[0].UseDevPortal) {
                    Webroot_Extension.useDevPortal = obj.DATA[0].UseDevPortal;
                    Webroot_Extension.serverPath = Webroot_Extension.devServerPath;
                }
                else Webroot_Extension.useDevPortal = 0;

                Webroot_Extension.SRA_CONFIG = obj.DATA[0].CONFIG;
                Webroot_Extension.SRA_DATE = obj.DATA[0]["CONFIG-DATE"];
            }
        }
    },

    // -------------------------- //
    // Recieve URL classification //
    // -------------------------- //
    handleBcapResponse: function (response) {
        if (response.responseBlkURL != null) {
            // Suppress JS Prompts
            Webroot_Helper.addJS_Node(document, null, Webroot_Helper.overrideSelectNativeJS_Functions);

            // Navigate to Blockpage
            window.location = response.responseBlkURL; return true;
        }
        else if (response.responseText == 0) { return true; }
        else if (response.responseText == 1062) {
            Webroot_Extension.urlBlocking = 0;
            Webroot_Extension.phishBlocking = 0;
            Webroot_Extension.searchAnnotation = 0;
            Webroot_Extension.agentPwd = 0;
            Webroot_Extension.chromeVersion = 1;
            Webroot_Extension.newProtocol = 0;
            Webroot_Extension.useDevPortal = 0;
            Webroot_Extension.SRA_DATE = Webroot_Extension.SRA_DATE_DEFAULT;
            Webroot_Extension.SRA_CONFIG = Webroot_Extension.SRA_CONFIG_DEFAULT;

            return true;
        }

        return false;
    },

    // -------------------------- //
    // Recieve URL Phishing score //
    // -------------------------- //
    handlePhreshPhishResponse: function (response) {
        if (response.responseText == 1062) {
            Webroot_Extension.urlBlocking = 0;
            Webroot_Extension.phishBlocking = 0;
            Webroot_Extension.searchAnnotation = 0;
            Webroot_Extension.agentPwd = 0;
            Webroot_Extension.chromeVersion = 1;
            Webroot_Extension.newProtocol = 0;
            Webroot_Extension.useDevPortal = 0;
            Webroot_Extension.SRA_DATE = Webroot_Extension.SRA_DATE_DEFAULT;
            Webroot_Extension.SRA_CONFIG = Webroot_Extension.SRA_CONFIG_DEFAULT;

            return true;
        }
        else if (response.responseText != 0) {
            // Suppress JS Prompts
            Webroot_Helper.addJS_Node(document, null, Webroot_Helper.overrideSelectNativeJS_Functions);

            // Navigate to Blockpage
            window.location = response.responseText;
            return true;
        }

        return false;
    },

    // ---------------------------------------- //
    // Extract Search results and annotate them //
    // ---------------------------------------- //
    processSearchPage: function (body, eventType, domainCount) {
        for (var searchIndex = 0; searchIndex < domainCount.length; searchIndex++) {
            // Check if Page is already being processed
            if (Webroot_Extension.links.length != 0) return;

            if (eventType == "DOCUMENTCOMPLETE") {
                // Create Array of MyObjects (GLOBAL)
                Webroot_Extension.links = new Array();		// <A> TAGS
                Webroot_Extension.frameSrc = new Array();		// <IFrame> Tags
            }

            // Get ALL Parent Tags within <Body>
            var parentTags = body.getElementsByTagName(Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].parent);

            // Iterate through all <div> tags
            for (var i = 0; i < parentTags.length; i++) {
                // Check Parent ID
                if (Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].pid != '') {
                    if (parentTags[i].id.search(Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].pid) == -1) continue;
                }

                // Check Parent Class Name
                if (Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].pclass != '') {
                    if (parentTags[i].className.search(Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].pclass) == -1) continue;
                }

                // Get all Element tags within the Parent
                var elementTags = parentTags[i].getElementsByTagName(Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].elem);

                // Iterate through all Element tags
                for (var j = 0; j < elementTags.length; j++) {
                    // Check Element ID
                    if (Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].eid != '') {
                        if (elementTags[j].id.search(Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].eid) == -1) continue;
                    }

                    // Check Element Class Name
                    if (Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].eclass != '') {
                        if (elementTags[j].className.search(Webroot_Extension.SRA_CONFIG[domainCount[searchIndex]].eclass) == -1) continue;
                    }

                    // Get all <div>..</div> tags within the Element
                    var webrootTags = elementTags[j].getElementsByTagName("div");
                    var webrootFlag = true;

                    // Traverse All <div> tags
                    for (var a = 0; a < webrootTags.length; a++) {
                        // If Element contains <div id= 'WebrootDiv'>, then it has been previously processed
                        if (webrootTags[a].id == 'WebrootDiv' || webrootTags[a].id == 'WebrootProcessing')
                            webrootFlag = false;
                    }

                    if (webrootFlag == false)
                        continue;

                    if (Webroot_Extension.links.length >= 100)
                        continue;

                    // Create New <div id="WebrootProcessing"> Tag
                    var newNode = document.createElement('div');
                    newNode.id = "WebrootProcessing";
                    newNode.setAttribute("style", "display:inline");

                    // Add Grey Image to New HTML element
                    var imgURL = Webroot_Extension.serverPath + "images/v2/loader_icon.gif";
                    var myResult = "<img src='" + imgURL + "' title='" + chrome.i18n.getMessage("processing") + "' /> ";
                    newNode.innerHTML = myResult;

                    // Add HTML element to Current Node
                    elementTags[j].insertBefore(newNode, elementTags[j].childNodes[0]);

                    // Save Current DOM Element
                    Webroot_Extension.links.push(new Webroot_Extension.myobject(elementTags[j]));
                }
            }

            // Process Bulk Request
            if (Webroot_Extension.links.length != 0) {
                var linksArray = Webroot_Helper.create_URL_Array(Webroot_Extension.links, domainCount[searchIndex]);

                chrome.runtime.sendMessage({ msg: "classifyBulk", links: linksArray }, function (response) {
                    if (response.responseText == 0) Webroot_Extension.removeLoadingIconsGray();
                    else if (response.responseText == 1062) {
                        Webroot_Extension.removeLoadingIconsGray();

                        Webroot_Extension.urlBlocking = 0;
                        Webroot_Extension.phishBlocking = 0;
                        Webroot_Extension.searchAnnotation = 0;
                        Webroot_Extension.agentPwd = 0;
                        Webroot_Extension.chromeVersion = 1;
                        Webroot_Extension.newProtocol = 0;
                        Webroot_Extension.useDevPortal = 0;
                        Webroot_Extension.SRA_DATE = Webroot_Extension.SRA_DATE_DEFAULT;
                        Webroot_Extension.SRA_CONFIG = Webroot_Extension.SRA_CONFIG_DEFAULT;
                    }
                    else Webroot_Extension.updateSearchResult(response.responseText)

                    return;
                });
            }
        }
    },

    // ------------------------------ //
    // Property Changed event Handler //
    // ------------------------------ //
    onPropertyChanged: function (event) {
        // Ensure that hash has changed
        if (!_csi_GBrowser) return 0;
        if (!_csi_GBrowser.URL.hash.event.status.changed) return 0;

        // Process page
        Webroot_Extension.onHover();
    },
};

// Initialize ContentScript
Webroot_Extension.init();