const accountSid = '';
const authToken = '';
const client = require('twilio')(accountSid, authToken);

client.calls
    .create({
        url: 'http://7b4ce7e1.ngrok.io/static/first.xml',
        to: '+919841142637',
        from: '+15204334504'
    })
    .then(call => console.log(call.sid))
    .done();