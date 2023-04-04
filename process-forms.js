// POST form data to Zapier
  
// get a reference to the forms
var $form = $('form#email-form');
// the submit btn id
var submitBtnId = '#form-submit';
var webhookUrl = 'https://hooks.zapier.com/hooks/catch/12773137/326vihk/';
var singleGunForm = 'https://www.cashforarms.com/single-gun-form/';
var multipleGunForm = 'https://www.cashforarms.com/multiple-guns/';
var somethingElseForm = 'https://www.cashforarms.com/other/';

// for each form
$form.each((i, form)=>{
  // update chosen radio btn to allow a form resubmit to jotform
  if ( sessionStorage.getItem('selected-radio') ) {
    var selectedRadio = sessionStorage.getItem('selected-radio'); 
    var radioBtn = [...$(form).find('input[type=radio]')].filter(radio => $(radio).closest('label').find('span').text().toLowerCase().trim() === selectedRadio);
    if (radioBtn.length) $(radioBtn).closest('label').find('.w-radio-input')[0].click();
  }
  // get a reference to the submit button
  var $submitBtn = $(form).find(submitBtnId);  
  
  // every time the user types in a new email
  $(form).find('input[type=email]').change(e => {
    // get a reference to the email field
    var email = $(e.currentTarget);
    // get the submit button url
    var submitBtnUrl = $submitBtn.attr('url');
    // if the submit button url is set
    if (submitBtnUrl) {
      // replace the email with the newly typed email
      submitBtnUrl = submitBtnUrl.replace(/myEmail=.*$/, `myEmail=${email.val()}`);
      $submitBtn.attr('url', submitBtnUrl);
    }
  });

  // on each radio button click
  $(form).find('input[type=radio]').click(e => {
    // get a reference to the radio button
    var radio = $(e.currentTarget);
    // get the radio button's name
    var radioName = radio.closest('label').find('span').text();
    // get the user email filled in the form
    var userEmail = radio.closest('form').find('input[type=email]').val();
    // if the radio button is named 'Single Gun'
    if (radioName.toLowerCase().includes('single gun')) {
      // add in 'Single Gun' url
      $submitBtn.attr('url', `${singleGunForm}?myEmail=${userEmail}`);
    }
    // if the radio button is named 'Multiple Guns'
    else if (radioName.toLowerCase().includes('multiple guns')) {
      // add in 'Multiple Guns' url
      $submitBtn.attr('url', `${multipleGunForm}?myEmail=${userEmail}`);
    }
    // if the radio button is named 'Something Else'
    else if (radioName.toLowerCase().includes('something else')) {
      // add in 'Something Else' url
      $submitBtn.attr('url', `${somethingElseForm}?myEmail=${userEmail}`);
    }
    // store selected radio btn
    var name = radio.closest('label').find('span').text().toLowerCase().trim();
    sessionStorage.setItem('selected-radio', name);
  });

  // on submit button click
  $submitBtn.click(async e => {
    // validate the form
    validateForm($(form));
    
    // check if all the form's inputs are filled in 
    // if not all are filled in abort
    if ([...$(form).find('.c-form_col input')]
        .filter(inp => $(inp).attr('required') && !$(inp).val().trim()).length) return;

    // if everything checks out
    // send payload to zapier 
    // & redirect the page to the relevant url
    if ($(e.currentTarget).attr('url')) { 
      await sendPayloadToZapier(form);
      window.location.href = $(e.currentTarget).attr('url');
    } 
  });    
});

async function sendPayloadToZapier(form) { 
  // generate the form data object to send to zapier
  // find all inputs
  var formData = [...$(form).find('.c-form_col input')].reduce((obj,inp)=>{
    // get each input's name
    var name = $(inp).attr('placeholder') || $(inp).attr('data-name');
    // get each input's value
    var val = $(inp).val();
    // add the name & value to the form data object
    obj[name] = val;
    return obj;
  },{});

  // if any radio button is checked
  if( $(form).find('input[type=radio]:checked').length ) {
    // get its name
    var checkedLabel = $(form).find('input[type=radio]:checked')
    .closest('label').find('span').text();
    // add its name & checked value to the form data object
    formData.Selling = checkedLabel;
  }
  else {
    // if no radio button is checked
    // add it as blank
    formData.Selling = '';
  }

  // turn the form data object to json 
  // so it can be sent to zapier using the fetch api
  var data = JSON.stringify(formData);

  // create the fetch api's options 
  var options = {
    method: 'POST',
    body: data
  };

  // add the zapier webhook url & options to the fetch api and send
  try {
    var response = await fetch(webhookUrl, options);
    var result = await response.json();
    console.log(result);
  }
  catch (e) { // log any failure to send webhook
    console.log('error', e);
  }
}

function validateForm(form){
  if (form[0].checkValidity()){
      // A valid form ready for submit
      makeWebflowFormAjax(form, successCallback, errorCallback, whileSubmitingForm); 
  }
  else{
      form[0].reportValidity(); 
  }
}

function successCallback(resultData){
  // Define here What should happen after successful Form Submission
  console.log('Form submission success'); 
}

function errorCallback(e){
  // Define here What should happen after Failure of Form Submission
  console.log('Form submission failed');  
}

function whileSubmitingForm(form){
  // Define here What should happen while submitting the form data and waiting for the response
  form.find(submitBtnId).text('Please wait..'); 
}

function findFields(form, result) {
  result = result || {}; 
  form.find(':input:not([type="submit"]):not([type="file"])').each(function (i, el) {
    var field = $(el);
    var type = field.attr('type');
    var name = field.attr('data-name') || field.attr('name') || 'Field ' + (i + 1);
    var value = field.val();

    if (type === 'checkbox') {
      value = field.is(':checked');
    } else if (type === 'radio') {
      if (result[name] === null || typeof result[name] === 'string') {
        return;
      }

      value = form.find('input[name="' + field.attr('name') + '"]:checked').val() || null;
    }

    if (typeof value === 'string') {
      value = $.trim(value);
    }

    result[name] = value;
  });
}

function makeWebflowFormAjax( form, successCallback, errorCallback, whileSubmitingForm) {
  let siteId = $('html').attr('data-wf-site');
  let formUrl = "https://webflow.com" + '/api/v1/form/' + siteId;

  var payload = {
      name: form.attr('data-name'),
      source: window.location.href,
      test: Webflow.env(),
      fields: {},
      fileUploads: {},
      dolphin: /pass[\s-_]?(word|code)|secret|login|credentials/i.test(form.html()),
  };

  findFields(form, payload.fields)

  whileSubmitingForm(form)
  // call via ajax
  $.ajax({
      url: formUrl,
      type: 'POST',
      data: payload,
      dataType: 'json',
      crossDomain: true,

      success: function (resultData) {
          if (typeof successCallback === 'function') {
              successCallback(resultData);
          }
      },

      error: function (e) {
          // call custom callback
          if (typeof errorCallback === 'function') {
              errorCallback(e)
          }
      }
  });         
}