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

//=================================================================================================================
//몽고의 주차요금을 pay_forten 에 넣어주는 함수
async function getPay(){
	MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");

    //분당 금액 확인
    dbo.collection("parkop").find({"id":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      pay_forten = result[0]["payment_amount"];
      console.log(pay_forten);
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
    const dbo = db.db("parkdb");

    //회차시간 확인
    dbo.collection("parkop").find({"id":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      return_time = result[0]["return_time"];
      console.log(return_time);
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
    const dbo = db.db("parkdb");

    //시작시간 확인
    dbo.collection("parkop").find({"id":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      start_time = result[0]["start_time"];
      console.log(start_time);
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
    const dbo = db.db("parkdb");

    //마감시간 확인
    dbo.collection("parkop").find({"id":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      end_time = result[0]["end_time"];
      console.log(end_time);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getEndTime().then();

//=================================================================================================================
//몽고의 대여 마감 시간을 end_time 에 넣어주는 함수
async function getEndTime(){
	MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");

    //마감시간 확인
    dbo.collection("parkop").find({"id":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      end_time = result[0]["end_time"];
      console.log(end_time);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getEndTime().then();
//=================================================================================================================

//모든 결제 데이터 조회
app.get("/payment/payinfo/all", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("payinfo").find({}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
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
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("payinfo").updateMany({"car_num" : car_number}, {$set:{"coupon" : coupon}}, {upsert: true})
      if (err) throw err;
      res.json({couponInfo : [{car_num : car_number, coupon : coupon}]});
    });
})


//======================================================================================================================
// 출차하는 차량의 주차요금 정산
// 주차요금은 10분당 500원
app.post("/payment/pay/pay", (req, res) => {
	MongoClient.connect(urp, function(err, db) {
    const car_number = req.body.car_number
		if (err) throw err;
		const dbo = db.db("parkdb");
		dbo.collection("payinfo").find({"car_num":car_number}, {projection:{_id:0}}).toArray(function(err, result) {
		  	if (err) throw err;
        var coupon = result[0]['coupon'];
        var outtime = new Date((result[0]['out_time']));
        var entertime = new Date((result[0]['enter_time']));
        var totaltime = Math.ceil(((outtime.getTime() - entertime.getTime())/1000/60)/10)*10;
        if (totaltime <= return_time) {
          res.json({payment:[{car_num:car_number, payment:"회차차량입니다."}]});
        
        }else{
          if (coupon > 0) {
            let data_fee = (totaltime/10-(coupon*6))* pay_forten;
            if (data_fee <= 0) {
              res.json({payment:[{car_num:car_number, payment:"상점 이용 감사합니다."}]});
            }else if (data_fee > 0) {
              res.json({payment:[{car_num:car_number, payment:data_fee}]});
            }
          }else if (coupon <= 0) {
            let data_fee = (totaltime/10)* pay_forten;
            res.json({payment:[{car_num:car_number, payment:data_fee}]});
          }
        }db.close();
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
    const enter_time = req.body.enter_time
    const out_time = req.body.out_time
    const payment_amount = req.body.payment_amount
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("payinfo").updateMany({"car_num" : car_number}, {$set:{"payment_amount" : payment_amount,"enter_time" : enter_time, "out_time" : out_time}}, {upsert: true})
      if (err) throw err;
      res.json({status : "success"});
    });
})












//몽고의 차량 대수 값을 CAR_NUMBER 변수에 넣어주는 함수
async function getNumberOfCar(){
	MongoClient.connect(uri, function(err, db) {
	if (err) throw err;
	const dbo = db.db("parkdb");

	// 전체 차량 대수 확인
	dbo.collection("park").count({}, function(err, numOfDatas){
		CAR_NUMBER = numOfDatas;
		if(err) throw err;
			db.close();
		});
	});
	await Promise.resolve("ok");
}
getNumberOfCar().then();


//카운트 연습
async function getNumberNowOfCar(){
	MongoClient.connect(uri, function(err, db) {
	if (err) throw err;
	const dbo = db.db("parkdb");

	// 주차된 차량 대수 확인
	dbo.collection("park").countDocuments({"depTime":""},{projection:{_id:0}}), function(err,numOfNowDatas) {
		CAR_NOW = numOfNowDatas;
		if(err) throw err;
			db.close();
		};
  });
	await Promise.resolve("ok");
}
getNumberNowOfCar().then();

//몽고의 주차된 차량 대수 값을 CAR_NOW 변수에 넣어주는 함수
// async function getNumberNowOfCar(){
// 	MongoClient.connect(uri, function(err, db) {
// 	if (err) throw err;
// 	const dbo = db.db("parkdb");

// 	// 주차된 차량 대수 확인
// 	dbo.collection("park").find({"depTime":""}, {projection:{_id:0}}).count(function(err,numOfNowDatas) {
// 		CAR_NOW = numOfNowDatas;
// 		if(err) throw err;
// 			db.close();
// 		});
// 	});
// 	await Promise.resolve("ok");
// }
// getNumberNowOfCar().then();

//몽고의 주차장 전체공간을 park_number 에 넣어주는 함수
async function getNumberPark(){
	MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");

    //전체 주차장 주차대수 확인
    dbo.collection("park_area").find({"id":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      park_number = result[0]["전체공간"];
      console.log(park_number);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getNumberPark().then();

//몽고의 주차장 대여공간을 park_usenumber 에 넣어주는 함수
async function getUseNumberPark(){
	MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");

    //전체 주차장 주차대수 확인
    dbo.collection("park_area").find({"id":"1"}, {projection:{_id:0,id:0}}).toArray(function(err,result) {
      park_usenumber = result[0]["대여공간"];
      console.log(park_usenumber);
		  if(err) throw err;
			  db.close();
		  });
	});
	await Promise.resolve("ok");
}
getUseNumberPark().then();


//=================================================================================================================

//14쪽 실시간 현황 데이터 조회
app.get("/status/car/data/all", (req, res) => {
  MongoClient.connect(urp, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("park").find({}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json( {current_data : result});
      db.close();
    });
  });
})













//---------------------------------------------------------------------------------

//13쪽 주차장 사양조회
app.get("/status/car/space", (req, res) => {
  getNumberPark();
  res.json({park_setting : { all_place:park_number, rent_place:park_usenumber }});
});

//14쪽 실시간 현황 데이터 조회
app.get("/status/car/data/all", (req, res) => {
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("park").find({}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json( {current_data : result});
      db.close();
    });
  });
})

//   getNumberPark();
//   getNumberNowOfCar();

//   var Free_space = PARK_NUMBER - CAR_NOW
//   console.log(Free_space)
//   res.json({status:"OK", message:"OK", totalData:1, placecount:[{total:park_number, Free_space:Free_space}]});
// });

//simple api

//app.get("/Hello", (req, res) => {
//  res.json({status:"OK", message:"OK", totalData:1, total:park_area});
//})


//path parameter, request parm 0, response 0

app.get("/api/park/:park_id", (req, res) => {
  const park_id = req.params.park_id
  const bark = park.filter(data => data.id == park_id);
    if(park_id > park_area)
    res.json({status:"ok", "이 주차장의 최대 주차 대수" : park_area})
  res.json({Total:park_area, park:bark});
})

//post, request body, response 0

app.post("/api/park/parkBody", (req, res) => {
  const park_id = req.body.id
  const bark = park.filter(data => data.id == park_id);
    if(park_id > park_area)
    res.json({status:"ok", "이 주차장의 최대 주차 대수" : park_area})
  res.json({Total:park_area, park:bark});
})

//path parameter, request parm 0, response 0

app.get("/api/park/number/:car_id", (req, res) => {
  const car_id = req.params.car_id
    if(car_id > park_area)
    res.json({status:"ok", "이 주차장의 최대 주차 대수" : park_area})
  var Free_space = park_area - car_id
  res.json({Total:park_area, Free_space:Free_space});
})

//simple api

app.get("/Hello", (req, res) => {
  res.json({status:"OK", message:"OK", totalData:1, total:park_area});
})


//전체 주차장을 띄워주는 api
app.get("/api/db/park_area/function", (req, res) => {
  getNumberPark();
  res.json({status:"OK", message:"OK", totalspace:PARK_NUMBER});
});


//현황을 띄워주는 api
app.get("/api/db/park_area/function/now", (req, res) => {
  getNumberPark();
  getNumberNowOfCar();

  var Free_space = PARK_NUMBER - CAR_NOW
  console.log(Free_space)
  res.json({status:"OK", message:"OK", totalData:1, placecount:[{total:park_number, Free_space:Free_space}]});
});


// request param x, response 0
// response park_area
app.get("/api/db/park_area", (req, res) => {
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("park_area").find({}, {projection:{_id:0, id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json({status:"OK", message:"OK", result:result});
      db.close();
    });
  });
})

// request param 0, response 0
// response park_area
app.get("/api/db/park_area/number", (req, res) => {
  const parkid = req.query.id
  if (parkid < 1 || parkid >10){
    res.json({status:"ERROR-1004", message:"Invalid parkID!", totalData:0, parkTimeInfos:[{}]});
  }

  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("park_area").find({"id":parkid}, {projection:{_id:0}}).toArray(function(err,result) {
      if (err) throw err;
      res.json({status:"OK", message:"OK", result:result});
      db.close();
    });
  });
})

// request param x, response 0
// response park_carnumber
app.get("/api/db/park_car/number", (req, res) => {
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("park").count({}, function(err,result) {
      if (err) throw err;
      Allcar = car_number = result;
      res.json({status:"OK", message:"OK", Allcar});
      db.close();
    });
  });
})

// request param x, response 0
// response park_area
app.get("/api/db/park_count", (req, res) => {
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    const dbo = db.db("parkdb");
    dbo.collection("park").find({"depTime":""}, {projection:{_id:0}}).count(function(err,result) {
      if (err) throw err;
      res.json({status:"OK", message:"OK", result:result});
      db.close();
    });
  });
})


// Query parameter, request param O, response O

app.get("/api/park/number/car/car", (req, res) => {
  const car = req.query.car_id
  console.log(car)
    if(car > park_area)
    res.json({status:"ok", "이 주차장의 최대 주차 대수" : park_area})
  var Free_space = park_area - car
  console.log(Free_space)
  res.json({status:"OK", message:"OK", totalData:1, placecount:[{total:park_area, Free_space:Free_space}]});

})

//post, request body, response 0

app.post("/api/park/number/carBody", (req, res) => {
  const car_id = req.body.id
    if(car_id > park_area)
    res.json({status:"ok", "이 주차장의 최대 주차 대수" : park_area})
  var Free_space = park_area - car_id
  res.json({status:"OK", message:"OK", totalData:1, placecount:[{total:park_area, Free_space:Free_space}]});
})

//mongo

app.get("/api/mongo", (req, res) => {
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    let dbo = db.db("parkdb");
    dbo.collection("park_area").find().toArray(function(err,result) {

      if (err) throw err;
      console.log(result);
      res.json({status:"ok", message:"ok", result:result});
      console.log(result);
      db.close();
		});
	});
})

module.exports = app;