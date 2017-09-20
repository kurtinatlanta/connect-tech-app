'use strict';
const makeCard = require('./lib/makeCard.js'),
    ronSwansonApi = require('./lib/ronSwansonApi.js'),
    audiofiles = require('./lib/audiofile.js'),
    _ = require('lodash');

/**
  * Watercooler contains all of the custom and built in intents we are using for the skill.
**/

const payDays = [
    new Date('2017-09-22'),
    new Date('2017-10-06'),
    new Date('2017-10-20'),
    new Date('2017-11-03'),
    new Date('2017-11-17'),
    new Date('2017-12-01'),
    new Date('2017-12-15'),
    new Date('2017-12-29')
];

let dateDiffInDays = function(date1, date2) {
    return Math.floor((Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()) - Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate()) ) /(1000 * 60 * 60 * 24));
}

let nextPayDay = function(afterDate) {
    let nextDate = null;

    for (let i = 0; i < payDays.length; i++) {
        if (payDays[i] > afterDate) {
            nextDate = payDays[i];
            break;
        }
    }
    
    return nextDate;
}

let connectTech = function (app) {
    app.makeCard = makeCard;
    app.ronSwansonApi = ronSwansonApi;
    app.audiofiles = audiofiles;
    app._ = _;

    /**
     * app.pre is run before every request.
     */
    // app.pre = function (request) {
    //
    // };


    /**
     *  Custom Intents:
     *      launch
     *      getRonSwansonQuote
     *      audioPlayer
     **/
     app.launch(function (request, response) {
         response.say('Hello Connect Tech! You can hear a Ron Swanson Quote, or play the talking heads. What would like to hear?');
         response.shouldEndSession(false, 'What did you say?').send();
     });

     app.intent('getRonSwansonQuote', (request, response) => {
         return app.ronSwansonApi.getQuote()
            .then((quote) => {
                let finalQuote = quote;
                app.makeCard(finalQuote, response, 'ron');
                return response.say(`Ron Swanson Says: ${finalQuote}. Would you like to hear another quote?`)
                        .shouldEndSession(false, 'Say that again?')
                        .send();
            });
     });

    app.intent('whenIsPayDay', (request, response) => {
        console.log('whenIsPayDay');
        let today = new Date();
        let payDay = nextPayDay(today);
        let daysTillPayday = dateDiffInDays(today, payDay);
        let message = "";

        if (daysTillPayday < 7) {
            message = "Pay day is this Friday.";
        }
        else {
            message = "Pay day is next Friday.";
        }
        
        // app.makeCard(message, response, 'payday');
        console.log('whenIsPayDay - saying ' + message);
        return response.say(message).shouldEndSession(false, 'Say that again').send();
    });

     app.intent('audioPlayer', {
         slots: {NAME: 'NAME'}
     }, (request, response) => {
        let name = request.slot('NAME');
        return app.audiofiles.getPlaylist(name)
                .then((playlist) => {
                    console.log('playlist----', playlist.album.images[0]);

                    let track = playlist.preview_url;
                    let trackName = playlist.name;
                    let trackImage = playlist.album.images[0].url;
                    let audioPlayerPayload = {
                        url: track,
                        token: trackName,
                        expectedPreviousToken: 'some_previous_token',
                        offsetInMilliseconds: 0
                    };
                    
                    app.makeCard(trackName, response, trackImage);
                    console.log('response', JSON.stringify(response, null, 2));
                    return response.audioPlayerPlayStream('ENQUEUE', audioPlayerPayload).send();
                })
                .catch((error) => {
                    console.log('error', error);
                });
     });

    /**
     *  Amazon built-in intents:
     *      AMAZON.NextIntent,
     *      AMAZON.PauseIntent,
     *      AMAZON.ResumeIntent,
     *      AMAZON.StopIntent,
     *      AMAZON.CancelIntent
     *      AMAZON.HelpIntent
     **/
     app.intent('AMAZON.CancelIntent', (request, response) => {
         return response.say('Goodbye JazzCon!')
                             .shouldEndSession(true)
                             .send();
     });

};

module.exports = connectTech;
