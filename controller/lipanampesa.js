const request = require('request');
require('dotenv').config();
const { getTimestamp } = require('../utils/utils.timestamp.js');
const ngrok = require('ngrok');

// @desc initiate stk push
// @method POST
// @route /stkPush
// @access public
exports.initiateSTKPush = async (req, res) => {
    console.log("INSIDE STK INITIALIZATION", req.body)
  try {
    const { amount, phone, Order_ID } = req.body;
    
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = "Bearer " + req.safaricom_access_token;

    const timestamp = getTimestamp();
    const password = new Buffer.from(process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp).toString('base64');

    const callback_url = 'https://studious-socket.vercel.app';
 

    console.log("callback ", callback_url);
    request(
      {
        url: url,
        method: "POST",
        headers: {
          "Authorization": auth
        },
        json: {
          "BusinessShortCode": process.env.BUSINESS_SHORT_CODE,
          "Password": password,
          "Timestamp": timestamp,
          "TransactionType": "CustomerPayBillOnline",
          "Amount": amount,
          "PartyA": phone,
          "PartyB": process.env.BUSINESS_SHORT_CODE,
          "PhoneNumber": phone,
          "CallBackURL": `${callback_url}/api/stkPushCallback/${Order_ID}`,
          "AccountReference": "Wamaitha Online Shop",
          "TransactionDesc": "Paid online"
        }
      },
      function (e, response, body) {
        if (e) {
          console.error(e);
          res.status(503).send({
            message: "Error with the stk push",
            error: e
          });
        } else {
          res.status(200).json(body);
        }
      }
    );
  } catch (e) {
    console.error("Error while trying to create LipaNaMpesa details", e);
    res.status(503).send({
      message: "Something went wrong while trying to create LipaNaMpesa details. Contact admin",
      error: e
    });
  }
};

// Rest of the code remains the same...


// @desc callback route Safaricom will post transaction status
// @method POST
// @route /stkPushCallback/:Order_ID
// @access public

// @desc callback route Safaricom will post transaction status
// @method POST
// @route /stkPushCallback/:Order_ID
// @access public
exports.stkPushCallback = async (req, res) => {
  try {
    // order id
    const { Order_ID } = req.params;

    // callback details
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = req.body.Body.stkCallback;

    // get the meta data from the meta
    const meta = Object.values(await CallbackMetadata.Item);
    const PhoneNumber = meta.find(o => o.Name === 'PhoneNumber').Value.toString();
    const Amount = meta.find(o => o.Name === 'Amount').Value.toString();
    const MpesaReceiptNumber = meta.find(o => o.Name === 'MpesaReceiptNumber').Value.toString();
    const TransactionDate = meta.find(o => o.Name === 'TransactionDate').Value.toString();

    // do something with the data
    console.log("-".repeat(20), " OUTPUT IN THE CALLBACK ", "-".repeat(20));
    console.log(`
        Order_ID : ${Order_ID},
        MerchantRequestID : ${MerchantRequestID},
        CheckoutRequestID: ${CheckoutRequestID},
        ResultCode: ${ResultCode},
        ResultDesc: ${ResultDesc},
        PhoneNumber : ${PhoneNumber},
        Amount: ${Amount}, 
        MpesaReceiptNumber: ${MpesaReceiptNumber},
        TransactionDate : ${TransactionDate}
    `);

    res.json(true);
  } catch (e) {
    console.error("Error while trying to update LipaNaMpesa details from the callback", e);
    res.status(503).send({
      message: "Something went wrong with the callback",
      error: e.message
    });
  }
};


// @desc Check from safaricom servers the status of a transaction
// @method GET
// @route /confirmPayment/:CheckoutRequestID
// @access public


// @desc Check from safaricom servers the status of a transaction
// @method GET
// @route /confirmPayment/:CheckoutRequestID
// @access public
exports.confirmPayment = async (req, res) => {
  try {
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
    const auth = "Bearer " + req.safaricom_access_token;

    const timestamp = getTimestamp();
    const password = new Buffer.from(process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp).toString('base64');

    request(
      {
        url: url,
        method: "POST",
        headers: {
          "Authorization": auth
        },
        json: {
          "BusinessShortCode": process.env.BUSINESS_SHORT_CODE,
          "Password": password,
          "Timestamp": timestamp,
          "CheckoutRequestID": req.params.CheckoutRequestID
        }
      },
      function (error, response, body) {
        if (error) {
          console.log(error);
          res.status(503).send({
            message: "Something went wrong while trying to create LipaNaMpesa details. Contact admin",
            error: error
          });
        } else {
          res.status(200).json(body);
        }
      }
    );
  } catch (e) {
    console.error("Error while trying to create LipaNaMpesa details", e);
    res.status(503).send({
      message: "Something went wrong while trying to create LipaNaMpesa details. Contact admin",
      error: e
    });
  }
};


