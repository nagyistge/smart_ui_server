/*
 * JMVC Controller for the SMArt bootstrap
 *
 * Ben Adida (ben.adida@childrens.harvard.edu)
 * Arjun Sanyal (arjun.sanyal@childrens.harvard.edu)
 * Josh Mandel (joshua.mandel@childrens.harvard.edu)
 */

SMART_HELPER  = {};

SMART_HELPER.tokens_by_app = {};
SMART_HELPER.creds_and_info_generator = function(app) { 
    return {'credentials' : 'foobar',
     	    'record_info' : {
		'full_name' : RecordController.CURRENT_RECORD.label,
		'id' : RecordController.CURRENT_RECORD.record_id
	         }
    };
};

//todo: this fn should take app_emai, for per-call token management
SMART_HELPER.api = function(message, callback) {
    var os = SMART_HELPER.oauth_service;
    var request = os.getSignedRequest({method: 'GET',
				       url: SMART_API_SERVER+message.func,
				       query:message.params
	});
    
    	$.ajax({
		beforeSend: function(xhr) {
		    var request_headers = request.getRequestHeaders();
		    for (var header in request_headers) {
			xhr.setRequestHeader(header, request_headers[header]);
		    }},
		    url: request.getUrl(),
		    data: request.getQueryParams(),
		    type: request.getMethod(),
			dataType: "text",
			success: callback,
			error: function(data) {
			    	  alert("error");
			      }
	});
};

SMART_HELPER.launch_app = function(app, account_id, record_id, callback) {
    	var account_id_enc = encodeURIComponent(account_id);
    	var record_id_enc = encodeURIComponent(record_id);
    	var app_email_enc = encodeURIComponent(app.id);

    	
    	$.ajax({
          		url: "/smart_api/accounts/"+account_id_enc+"/apps/"+app_email_enc+"/records/"+record_id_enc+"/launch",
			data: null,
			type: "GET",
			dataType: "text",
			success: 
			      function(data) {
    				d  = MVC.Tree.parseXML(data);    				
    				if (d.AccessToken.App["@id"] !== app.id)
    					throw "Got back access tokens for a different app! " + app.id +  " vs. " + d.AccessToken.App["@id"];
    				SMART_HELPER.tokens_by_app[app.id] = {token:d.AccessToken.Token, secret: d.AccessToken.Secret};
				SMART_HELPER.oauth_service  = new OAuthServiceSmart({consumer_key: app.data.consumer_key, consumer_secret: app.data.secret, token_key: d.AccessToken.Token, token_secret: d.AccessToken.Secret});


    				callback();
			      },
			error: function(data) {
			    	  // error handler
			    	  err = data;
			    	  alert("error fetching token xml " + data);
			      }
    	});    		
};



MainController = MVC.Controller.extend('main', {
  load: function(params) {      
      ACCOUNT = new Account(ACCOUNT_ID); // init the account via model
      SMART = new SMART_CONTAINER(SMART_HELPER);
      this.setup();
  },
    
  setup: function(params) {
    RecordController.dispatch('setup');
	PHAController.dispatch('setup');

    // init the "app tabs"
    $("#app_selector").tabs();

    // Attach the Healthfeed click handler
    $('[href=\'#_healthfeed_tab_panel_hidden\']').click(function(){ HealthfeedController.dispatch('index'); });
    $('[href=\'#_patient_search_tab_panel_hidden\']').click(function(){ PatientSearchController.dispatch('index'); });
    $('#manage_apps_link').click(function(){ PHAController.dispatch('index'); });
    // Run Healthfeed    
    PatientSearchController.dispatch('index');
    
    $(window).resize(function() {
    	
    	var $elt = $("#app_content_iframe").is(":visible")? 
    			   $("#app_content_iframe") : $("#app_content");
    	
        $elt.hide();        	
        $elt.css("height", $("#bigbody").height()- 25);
        $elt.css("width", $("#bigbody").width()-175); // hard-wired width to match left-column width in CSS.  Sigh...  -JM
        $elt.show();    		
    });
    
    $(window).resize();
    $('#app_content_iframe').load( 
    		function() {
		    $('#app_content_iframe').show();
		    $('#app_content_iframe').focus();
		    $(window).resize();
    		});

  }

});