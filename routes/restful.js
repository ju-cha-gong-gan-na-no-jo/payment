const express =require("express");
const bodyParser = require('body-parser');
const app = express();
const { MongoClient } = require('mongodb');
const env =require("dotenv").config({ path: "/home/bitnami/payment/.env"});
var uri = process.env.uri;
var urp = process.env.urp;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));
app.use(express.json());
app.use(express.urlencoded({extended : true}));
const today = new Date();
const year = today.getFullYear();
const month = ('0' + (today.getMonth() + 1)).slice(-2);
const day = ('0' + today.getDate()).slice(-2);

//=================================================================================================================
//몽고의 주차요금을 pay_forten 에 넣어주는 함수
async function getPay(){
	MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");

    //분당 금액 확인
    dbo.collection("PAY_OPTION").find({"PARK_NUM":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      pay_forten = result[0]["PAY_FEE"];
      // console.log(pay_forten);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getPay().then();


//=================================================================================================================
//몽고의 회차시간을 return_time 에 넣어주는 함수
async function getReturnTime(){
	MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");

    //회차시간 확인
    dbo.collection("PAY_OPTION").find({"PARK_NUM":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      return_time = result[0]["RETURN_TIME"];
      // console.log(return_time);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getReturnTime().then();

//=================================================================================================================
//몽고의 대여 시작 시간을 start_time 에 넣어주는 함수
async function getStartTime(){
	MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");

    //시작시간 확인
    dbo.collection("PAY_OPTION").find({"PARK_NUM":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      start_time = result[0]["START_TIME"];
      // console.log(start_time);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getStartTime().then();

//=================================================================================================================
//몽고의 대여 마감 시간을 end_time 에 넣어주는 함수
async function getEndTime(){
	MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");

    //마감시간 확인
    dbo.collection("PAY_OPTION").find({"PARK_NUM":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      end_time = result[0]["END_TIME"];
      // console.log(end_time);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getEndTime().then();

//=================================================================================================================
//몽고의 패널티 주차요금을 penalty_fee  에 넣어주는 함수
async function getPenaltyPay(){
	MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");

    //분당 금액 확인
    dbo.collection("PAY_OPTION").find({"PARK_NUM":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      penalty_fee = result[0]["PARK_DAY_FEE"];
      // console.log(penalty_fee);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getPenaltyPay().then();
//=================================================================================================================

//모든 결제 데이터 조회
app.get("/payment/payinfo/all", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").find({}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

//======================================================================================================================
//쿠폰적용

app.post("/payment/coupon/add", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    const car_number = req.body.car_number
    const coupon = req.body.coupon
    const store_num = req.body.store_num
    const store_name = req.body.store_name
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").updateMany({"CAR_NUM" : car_number}, {$set:{"COUPON" : coupon, "COUPON_STATUS" : "T", "MEMBER_TYPE" : "상점고객", "STORE_NUM" : store_num, "STORE_NAME" : store_name, MEMBER_TYPE_NUM : "5" }}, {upsert: true})
      if (err) throw err;
      res.json({couponInfo : [{CAR_NUM : car_number, COUPON : coupon}]});
    });
})


//======================================================================================================================
// 출차하는 차량의 주차요금 정산
// 주차요금은 10분당 500원
app.post("/payment/pay/pay", (req, res) => {
	MongoClient.connect(urp, function(err, db) {
    const car_number = req.body.car_number
		if (err) throw err;
		const dbo = db.db("PAYDB");
		dbo.collection("PAY_INFO").find({"CAR_NUM":car_number}, {projection:{_id:0}}).toArray(function(err, result) {
		  	if (err) throw err;
        var coupon = result[0]['COUPON'];
        var outtime = new Date(result[0]['OUT_TIME']);
        var entertime = new Date(result[0]['IN_TIME']);
        var totaltime = Math.ceil(((outtime.getTime() - entertime.getTime())/1000/60)/10)*10;
        var sttime = new Date(year + '-' + month + '-' + day + 'T' + start_time + ':' + '00' + '.000Z');
        var endtime = new Date(year + '-' + month + '-' + day + 'T' + end_time + ':' + '00' + '.000Z');
        var intime = entertime
        var escapetime = outtime
        var yeari = intime.getFullYear();
        console.log(yeari);
        var monthi = ('0' + (intime.getMonth() + 1)).slice(-2);
        console.log(monthi);
        var dayi = ('0' + intime.getDate()).slice(-2);
        console.log(dayi);
        var houri = ('0' + intime.getHours()).slice(-2);
        console.log(houri);
        var minutesi = ('0' + intime.getMinutes()).slice(-2);
        console.log(minutesi);
        var iintime = yeari + '-' + monthi + '-' + dayi + ' ' + houri + ':' + minutesi
        console.log(iintime);
        var yeare = escapetime.getFullYear();
        console.log(yeare);
        var monthe = ('0' + (escapetime.getMonth() + 1)).slice(-2);
        console.log(monthe);
        var daye = ('0' + escapetime.getDate()).slice(-2);
        console.log(daye);
        var houre = ('0' + escapetime.getHours()).slice(-2);
        console.log(houre);
        var minutese = ('0' + escapetime.getMinutes()).slice(-2);
        console.log(minutese);
        var escapeetime = yeare + '-' + monthe + '-' + daye + ' ' + houre + ':' + minutese
        console.log(escapeetime);

        // console.log(typeof(entertime));
        // console.log(typeof(entertime.getTime()));
        // console.log(typeof(start_time));
        // console.log(typeof(sttime));
        // console.log(typeof(entertime.getTime() < sttime.getTime()));
        // console.log(entertime < sttime);
        // console.log(outtime > end_time);
        // console.log(outtime);
        // console.log(end_time);
        // console.log(endtime);
        // console.log(typeof(totaltime));
        // console.log(totaltime/60);



        if (totaltime <= return_time) {
          res.json({payment:[{car_num:car_number, payment:"회차차량입니다."}]});
        
        }else if (entertime.getTime() < sttime.getTime() || outtime.getTime() > endtime.getTime()) {
          // console.log(entertime);
          // console.log(start_time);
          // console.log(entertime < start_time);
          // console.log(outtime > end_time);
          var result = parseInt(totaltime/60/24);
            if ((totaltime/60) > 24) {
              dbo.collection("PAY_INFO").updateMany({"CAR_NUM" : car_number}, {$set:{"PAY_AMOUNT" : penalty_fee*result, "PARK_TIME" : totaltime}}, {upsert: true});
              res.json({payment:[{car_num:car_number, payment:penalty_fee*result, in_time:iintime, out_time:escapeetime, coupon:coupon}]});
            }else if ((totaltime/60) <= 24) {
              dbo.collection("PAY_INFO").updateMany({"CAR_NUM" : car_number}, {$set:{"PAY_AMOUNT" : penalty_fee, "PARK_TIME" : totaltime}}, {upsert: true});
              res.json({payment:[{car_num:car_number, payment:penalty_fee, in_time:iintime, out_time:escapeetime, coupon:coupon}]});          
            }
        }else {  
          if (coupon > 0) {
            let data_fee = (totaltime/10-(coupon*6))* pay_forten;
            let data_fee1 = (totaltime/10)* pay_forten;
            if (data_fee <= 0) {
              dbo.collection("PAY_INFO").updateMany({"CAR_NUM" : car_number}, {$set:{"PAY_AMOUNT" : data_fee1, "PARK_TIME" : totaltime}}, {upsert: true});
              res.json({payment:[{car_num:car_number, payment:data_fee1, remark :"상점 이용 감사합니다.", in_time:iintime, out_time:escapeetime, coupon:coupon}]});
            }else if (data_fee > 0) {
              dbo.collection("PAY_INFO").updateMany({"CAR_NUM" : car_number}, {$set:{"PAY_AMOUNT" : data_fee, "PARK_TIME" : totaltime}}, {upsert: true});
              res.json({payment:[{car_num:car_number, payment:data_fee, remark :"상점 이용 감사합니다.", in_time:iintime, out_time:escapeetime, coupon:coupon}]});
            }
          }else if (coupon <= 0) {
            let data_fee = (totaltime/10)* pay_forten;
            dbo.collection("PAY_INFO").updateMany({"CAR_NUM" : car_number}, {$set:{"PAY_AMOUNT" : data_fee, "PARK_TIME" : totaltime}}, {upsert: true});
            res.json({payment:[{car_num:car_number, payment:data_fee, in_time:iintime, out_time:escapeetime, coupon:coupon}]});
          }
        }
          // res.json((outtime.getTime() - entertime.getTime())/1000/60/10* pay_forten);
			    // let data_fee = (outtime.getTime() - entertime.getTime())/1000/60/10* pay_forten; 
			    // res.json({status:"OK", message:"OK", totalData:1, parkFeeInfos:[{car_num:car_number, fee:data_fee}]});
		  	  // db.close();
		});
	});	
});

//======================================================================================================================
//결제 완료 정보 저장

app.post("/payment/pay/addpay", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    const car_number = req.body.car_number
    // const enter_time = req.body.enter_time
    // const out_time = req.body.out_time
    const payment_amount = req.body.payment_amount
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").updateMany({"CAR_NUM" : car_number}, {$set:{"PAY_AMOUNT" : payment_amount}}, {upsert: true})
      if (err) throw err;
      res.json({status : "success"});
    });
})


//-----------------------------------------------------------------------------------
// 특정 차량 결제 데이터 조회
app.post("/payment/pay/data/num", (req, res) => {
  const car_number = req.body.car_number
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").find({"CAR_NUM":car_number}, {projection:{_id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json({found_data : result});
      db.close();
    });
  });
})

//-----------------------------------------------------------------------------------
// 오늘하루 전체 누적금액 추출

app.get("/payment/payinfo/all/sum", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").aggregate([  { $group: { _id: null, "TOTAL": {$sum: "$PAY_AMOUNT"}}}]).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

module.exports = app;


//-----------------------------------------------------------------------------------
// 오늘하루 개인 전체 누적금액 추출

app.get("/payment/payinfo/all/cus", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").aggregate([{$match: { MEMBER_TYPE : "방문객" }} ,  { $group: { _id: null, "TOTAL": {$sum: "$PAY_AMOUNT"}}}]).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

module.exports = app;

//-----------------------------------------------------------------------------------
// 오늘하루 상점 전체 누적금액 추출

app.get("/payment/payinfo/all/sto", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").aggregate([{$match: { MEMBER_TYPE : "상점손님" }} ,  { $group: { _id: null, "TOTAL": {$sum: "$PAY_AMOUNT"}}}]).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

module.exports = app;

//-----------------------------------------------------------------------------------
// 오늘하루 특정 상점 전체 누적금액 추출

app.post("/payment/payinfo/all/sto/spe", (req, res) => {
  const sto_name = req.body.sto_name
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").aggregate([{$match: { STORE_NAME : sto_name }} ,  { $group: { _id: null, "TOTAL": {$sum: "$PAY_AMOUNT"}}}]).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

//=================================================================================================================

//방문객 결제 데이터 조회
app.get("/payment/payinfo/cus", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").find({MEMBER_TYPE:"방문객"}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

module.exports = app;


//=================================================================================================================

//상점 결제 데이터 조회
app.get("/payment/payinfo/sto", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").find({MEMBER_TYPE:"상점손님"}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

module.exports = app;

//=================================================================================================================

// 특정 상점 결제 데이터 조회
app.post("/payment/payinfo/sto/name", (req, res) => {
  const sto_name = req.body.sto_name
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("PAYDB");
    dbo.collection("PAY_INFO").find({STORE_NAME:sto_name}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json( {paymentInfo : result});
      db.close();
    });
  });
})

module.exports = app;