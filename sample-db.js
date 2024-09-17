export const dbConfig = {
    // define users that can login and whether they have admin capability
    // you don't have to have any authorized users if you don't need them
    // currently admin users do not have any extra privileges but might in
    // the furture.
    'auth': {
        'user1': {
            'password': 'secret1',
            'admin': false
        },
        'user2': {
            'password': 'secret2',
            'admin': false
        },
        'admin': {
            'password': 'admin-secret;',
            'admin': true
        }
    },

    // whether any user or only logged in users can send feedback
    'requireLoginForFeedback': false,

    // whether or not you are using photo management extension with this database
    'hasPhotos': false,

    // examples of configuring email for this database
    'mailer': {
        // sample config for gmail
        'gmail': {
            'service': 'Gmail',
            'host': 'smtp.gmail.com',
            'port': 465,
            'auth': {
                'user': 'youremail@gmail.com',
                'pass': 'gmail-secret'
            },
            // 'debug': true,
            'tls': {
                'rejectUnauthorized': false
            }
        },
        // sample config for mailgun
        // you may need to edit routes/feedbackpost.js to configure it
        // to use mailgun
        'mailgun': {
            'auth': {
                'api_key': 'mailgun-api-key',
                //'domain': 'mg.example.com'
                'domain': 'sandbox-mailgun_sandbox_key.mailgun.org'
            }
        },
        // envelope for mail being send
        'options': {
            'from': 'youremail@gmail.com',
            'to': 'youremail@gmail.com',
            'subject': 'Feedback on "mygedcom" genealogy database',
            'text': 'nothing here, it will get filled out by feedback form'
        }
    }
};

