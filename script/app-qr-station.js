
/**
 * QR Station System
 * Author: NRK, 
 * Date: 02-06-2020
 * 
 */

/**
 * Class Props
 * - Property of app-qr-station
 */
class Props {

  //Props +properties (static)
  static prop = {
    set: "set",
    mode: "mode",
    userkey: "userkey",
  };

  static opt = {
    signMode: "sign-mode",
    sign: {
      IN: { userkey: null, mode: "IN" },
      "clock in": { userkey: "F1", mode: "clock in" },
      "clock out": { userkey: "F2", mode: "clock out" },
      "overtime in": { userkey: "F3", mode: "overtime in" },
      "overtime out": { userkey: "F4", mode: "overtime out" },
    },

    disp: {
      sign: "disp-sign",
      status: "disp-status",
    },
  };

  static delayUnDisplaySettedSignMode = 5000;
  static delayUnDisplayScannedSign = 5000;


  //@ +Props.displaySettedSignMode: แสดงผลการ Set Sign Mode
  static displaySettedSignMode(signMode) {
    let sign = this.opt.sign[signMode];
    $(`button[${this.prop.set}="${this.opt.signMode}"]`).prop("disabled", true);
    $(`#${this.opt.disp.status}`)
      .removeClass("alert-danger alert-success")
      .addClass("alert-primary")
      .show().html(`
          <strong>Set:  ${sign.userkey} (${sign.mode.toUpperCase()})</strong>
    `);
  }

  //@ +Props.unDisplaySettedSignMode: แสดงผลการสิ้นสุด Set Sign Mode
  static unDisplaySettedSignMode(signModeSelect) {
    $(`button[${this.prop.set}="${this.opt.signMode}"]`).prop("disabled", false);
    $(`#${this.opt.disp.status}`).hide();
  }

  //@ +Props.displaySettedSignMode: แสดงผลการ Set Sign Mode + Suscess
  static displaySettedSignModeSuccess() {
    $(`#${this.opt.disp.status}`)
      .removeClass("alert-danger alert-primary")
      .addClass("alert-success")
      .show().html(`
          <strong>บันทึกสำเร็จ (Save Suceessfully)</strong>
    `);
  }

  //@ +Props.unDisplaySettedSignModeSuccess: แสดงผลการสิ้นสุด Set Sign Mode + Suscess
  static unDisplaySettedSignModeSuccess() {
    $(`#${this.opt.disp.status}`).hide();
  }

  //@ +Props.displayScannedSign: แสดงผลการสแกน QR Code เพื่อลงเวลา
  static displayScannedSign(data) {
    let signMode = data.sign.mode.toUpperCase();
    $(`#${this.opt.disp.sign}`).html(`<span class="font-smb">Time      : </span> <span class="font-smb text-primary">${data.regisTime}</span><br/>
    <span class="font-smb">Fullname  : </span> <span class="font-sm text-primary">${data.fullname} </span><br/>
    <span class="font-sxb">Card Id   : </span> <span class="font-sx text-primary">${ data.cardId} </span><br/>
    <span class="font-sxb">Sign Mode : </span> <span class="font-sx text-primary">${data.sign.userkey ? data.sign.userkey.toUpperCase() +" (" + signMode +")": signMode} </span> <br/>
    `);
  }

  //@ +Props.displayScannedSign: แสดงผลการสิ้นสุดการสแกน QR Code เพื่อลงเวลา
  static unDisplayScannedSign() {
    $(`#${this.opt.disp.sign}`).html(`<p class="font-sm">กรุณา Scan QR Code เพื่อลงเวลา</p>`);
  }

  //@ +Props.displayCheckOnlineData: แสดงผล CheckOnline

  static displayCheckOnlineData(data) {
    $("#nav-bottom-stationName").html(data.stationName);

    let onlineStatus = (data.onlineStatus)?'online':'offline';
    let onlineClass = (data.onlineStatus)?'badge badge-pill badge-success':'badge badge-pill badge-danger';
    $("#nav-bottom-onlineStatus").html(onlineStatus).removeClass().addClass(onlineClass);

    $("#nav-bottom-peopleOnStation").html(`| <strong>System info</strong> - User: ${data.peopleOnStation}`);

    $("#nav-bottom-transactionRecord").html(`, Trans: ${data.transactionRecord}`);

    $("#nav-bottom-limitRecord").html(`, Limit Trans: ${data.limitRecord}`);
  }

  static displayLocation(data){
    $("#nav-bottom-sysLocation").html(`| <strong>Hostname</strong> - App: ${data.app}, API: ${data.api}`);
  }
}

/**
 * Class QR 
 * - QRStation operation
 */
class QR {

  //@ QR #properties
  #defaultSignMode = Props.opt.sign.IN.mode;
  #timerScanned = null;
  #scanned = "";
  #preventQRScanCount = 0;
  
  //@ QR +properties
  preventQRScan = false;
  signMode = Props.opt.sign.IN.mode;
  beforeScanDo = undefined; // () => { //sannedSignDo }
  afterScanDo = undefined; // (resp) => { //sannedSignDo }
  finalScanDo = undefined;

  constructor() {
    this.apiServ = new APIServ();
    this.audioQRStationNotReady = new Audio("audio/qr-station-not-ready.m4a");
    this.init();
  }

  //@ +QR.init
  init() {
    let self = this;
    //###################################//
    //Bind QR-Scanner key each-text-of-code to #scanned and request API-transaction(in setTimeByQRCode function) after end of text-of-code.
    $(document).on("keypress", function (e) {
      if (!self.preventQRScan) {
        if (self.#scanned == "") {
          BlockUI.load({ message: "<h4>Scanning</h4>" });
        }
        self.#scanned += e.key;
        //อ่านโค้ด

        //timerScanned
        if (self.#timerScanned) {
          clearTimeout(self.#timerScanned);
        }

        //ถ้า QR Scanned จบ (ไม่มีการ keypress เพิ่ม นั่นคือไม่มีการ clearTimeout ภายใน 500 mls)  ให้เรียก setTimeByQRCode
        self.#timerScanned = setTimeout(() => {
          //beforeScanDo
          if (self.beforeScanDo) self.beforeScanDo();

          self.control({
            action: self.apiServ.transaction.setData.name,
            data: {
              qr: Base64.encode(self.#scanned), // from script/base64.js
              status: self.signMode,
            },
          });

          //Clear QR props
          self.#scanned = "";
          self.signMode = self.#defaultSignMode;
        }, 500);
      } else {
        if(self.#preventQRScanCount==0){
          self.audioQRStationNotReady.play();
          self.#preventQRScanCount++;
          setTimeout(()=>{self.#preventQRScanCount=0}, 2500);
        }else{
          return;
        }
      }
      e.preventDefault();
    });
    //###################################//
  }

  //@ +QR.control
  control(controlParam) {

    let action = controlParam.action;
    let data = controlParam.data;

    switch (action) {
      case this.apiServ.transaction.setData.name:

        if(!this.preventQRScan){

          $.when(this.apiServ.transaction.setData(data,  (jqXHR ) => {
              BlockUI.load({message: "Processing..."})
            })
          )
          .done((resp) => {
            let sign = Props.opt.sign[data.status];
            Object.assign(resp.context, {
              sign: { userkey: sign.userkey, mode: sign.mode },
            });
            this.apiServ.handleDone(resp, this.afterScanDo, this.finalScanDo);
          })
          .always(() => {
              if(!this.preventQRScan){BlockUI.unload()}
          });

        }

        break;
    }
  }
}

/***
 * Class AppQRStation
 * - Appilication QR Station
 */
class AppQRStation {

  //@ AppQRStation #properties
  #letCheckFullScreen = false;

  #CONFIG = {
    CHECK_ONLINE_PERIOD__MSEC: 1000*60*5,
    REFRESH_GUI_PERIOD: {
      HOUR: 2, 
      MINUTE: 0, 
      SECOND: 0
    },
    F14_DELAY_SECOND__MSEC: 1000*5,
    SCAN_DELAY_SECOND__MSEC: 1000*5,
  }

  #timerUnDisplayScannedSign = null;
  #timerUnDisplaySettedSignMode = null;

 

  constructor() {
    this.qr = new QR();
    this.timeServ = new TimeServ();
    this.utlServ = new UTLServ();
    this.apiServ = new APIServ();
    this.audioRecordSuccess = new Audio("audio/qr-station-scan-success.m4a");
    this.init();
  }

  //@ +AppQRStation.init
  init() {
    let self = this;

    Props.unDisplayScannedSign();
    Props.unDisplaySettedSignMode();

    //Bind click to signMode button
    $(`button[${Props.prop.set}="${Props.opt.signMode}"]`).each(function () {
      $(this).text(
        `${$(this).attr(Props.prop.userkey)} (${$(this).attr(Props.prop.mode).toUpperCase()})`
      );
    });
    $(`button[${Props.prop.set}="${Props.opt.signMode}"]`).on(
      "click",
      function () {
        self.controlSetSignMode(this);
      }
    );

    //Set QR.beforeScanDo  (What action before scan qr-code?)
    this.qr.beforeScanDo = () => {
      Props.unDisplayScannedSign();
      Props.unDisplaySettedSignMode();
    };

    //Set QR.afterScanDo (What action after scan qr-code?)
    this.qr.afterScanDo = (resp) => {
      let context = resp.context;
     
      //Audio บันทึกสำเร็จ
      this.audioRecordSuccess.play();
      
     
      //Diplay scanned-context
      this.controlScannedSign.display(context);

      //UnDiplay scanned-context
      this.controlScannedSign.refreshUnDisplay();
      this.controlScannedSign.unDisplay();

      //Diplay success
      this.controlSettedSignModeSuccess.display();

      //UnDiplay success
      this.controlSettedSignModeSuccess.refreshUnDisplay();
      this.controlSettedSignModeSuccess.unDisplay();
    };

    //Set QR.finalScanDo (What action final scan qr-code?)
    this.qr.finalScanDo = () => {
      //refresh UnDisplay signMode
      this.controlSettedSignMode.refreshUnDisplay();
      //UnDisplay signMode
      this.controlSettedSignMode.unDisplay();
    };

    //Clock-time diplaying 
    this.timeServ.clockDisp();


    //Fullscreen checking 
    if(this.#letCheckFullScreen) {
      $(document).ready(function () {
        self.checkFullscreen();
        $(window).on("resize", function () {
          self.checkFullscreen();
        });
      });
    }

    //Get updateConfig
    this.controlUpdateConfig();


    //Refresh UI/System checking
    window.setInterval( () => {
      // Set interval for refresh checking
    let date = new Date();
    //console.log({d: {h: date.getHours(), m: date.getMinutes()}, cref:{h:this.#CONFIG.REFRESH_GUI_PERIOD.HOUR, m:this.#CONFIG.REFRESH_GUI_PERIOD.MINUTE}});
      //condition currentTime == REFRESH_GUI_PERIOD
      if (date.getHours() === this.#CONFIG.REFRESH_GUI_PERIOD.HOUR && date.getMinutes() === this.#CONFIG.REFRESH_GUI_PERIOD.MINUTE) {
        //BlockUI and Display message
        BlockUI.load({ css: { width: "550px" },message: "Refreshing system, please wait...", overlayCSS: { cursor: "default" } });
        self.qr.preventQRScan = true;
         // Reload web-app
        setTimeout(() => {
          location.reload();
        }, 
        10000);
      }
     
    }, 60000); // Repeat every 60000 milliseconds (1 minute)  for check condition currentTime == REFRESH_GUI_PERIOD

   //checkOnline 
   this.checkOnline();
    window.setInterval(() => {
      this.checkOnline()
    }, 
    this.#CONFIG.CHECK_ONLINE_PERIOD__MSEC)  // Repeat every 60000 milliseconds (1 minute) * 5 (5 minute)
    
    Props.displayLocation(this.apiServ.gethostName);
  }

 

  //@ +AppQRStation.checkOnline
  checkOnline() {
    this.apiServ.checkOnline(
      ()=>{$("#nav-bottom-load-checkOnline").html("Chk-Onl..").show().fadeOut( 5000, "linear")}
    ).done((resp)=>{
      if(resp.status){
        Props.displayCheckOnlineData(resp.context);
      }
    })
  }

  //@ +AppQRStation.checkFullscreen
  checkFullscreen() {
    let self = this;
    if (
      screen.width == window.innerWidth &&
      screen.height == window.innerHeight
    ) {
      BlockUI.unload();
      self.qr.preventQRScan = false;
    } else {
      self.qr.preventQRScan = true;
      BlockUI.load({
        css: { width: "450px" },
        overlayCSS: { cursor: "default" },
        message: "Prevent from scanning QR-Code!",
      });
    }
  }

  //@ +AppQRStation.controlUpdateConfig
  controlUpdateConfig() {
    this.apiServ.configs.getSettingGui(
      ()=>{$("#nav-bottom-load-settingGui").html("Upd-Conf..").show().fadeOut( 5000, "linear")}
    ).done((resp)=>{

          //GET CONFIG AND CUSTOM DATA
          //CHECK_ONLINE_PERIOD
          this.#CONFIG.CHECK_ONLINE_PERIOD__MSEC = UTLServ.minuteToMillisec(Number(_.find(resp.context, ['name', 'CHECK_ONLINE_PERIOD']).value));

          //REFRESH_GUI_PERIOD
          let REFRESH_GUI_PERIOD = _.find(resp.context, ['name', 'REFRESH_GUI_PERIOD']).value;
          let refreshTime = REFRESH_GUI_PERIOD.split(":");

          $.extend(this.#CONFIG.REFRESH_GUI_PERIOD, {
            HOUR: Number(refreshTime[0]), 
            MINUTE: Number(refreshTime[1]), 
            SECOND:  Number(refreshTime[2])
          });

          //F14_DELAY_SECOND
          this.#CONFIG.F14_DELAY_SECOND__MSEC = UTLServ.secondToMillisec(Number(_.find(resp.context, ['name', 'F14_DELAY_SECOND']).value));
          
          //SCAN_DELAY_SECOND
          this.#CONFIG.SCAN_DELAY_SECOND__MSEC = UTLServ.secondToMillisec(Number(_.find(resp.context, ['name', 'SCAN_DELAY_SECOND']).value));

          console.log({CHECK_ONLINE_PERIOD: this.#CONFIG.CHECK_ONLINE_PERIOD__MSEC,
            REFRESH_GUI_PERIOD: this.#CONFIG.REFRESH_GUI_PERIOD,
            F14_DELAY_SECOND: this.#CONFIG.F14_DELAY_SECOND__MSEC,
            SCAN_DELAY_SECOND: this.#CONFIG.SCAN_DELAY_SECOND__MSEC
          });
    })
  
  }

  //@ +AppQRStation.controlSetSignMode
  controlSetSignMode(el) {
    //Set qr.signMode from user
    this.qr.signMode = $(el).attr(`${Props.prop.mode}`);

    //Display signMode
    this.controlSettedSignMode.display(this.qr.signMode);

    //refresh UnDisplay signMode
    this.controlSettedSignMode.refreshUnDisplay();

    //UnDisplay signMode
    this.controlSettedSignMode.unDisplay();
  }

  //@ +AppQRStation.controlSettedSignMode 
  controlSettedSignMode = {
    display: (signMode) => {
      Props.displaySettedSignMode(signMode);
    },
    refreshUnDisplay: () => {
      if (this.#timerUnDisplaySettedSignMode) {
        clearTimeout(this.#timerUnDisplaySettedSignMode);
      }
    },
    unDisplay: () => {
      this.#timerUnDisplaySettedSignMode = setTimeout(() => {
        this.qr.signMode = Props.opt.sign.IN.mode;
        Props.unDisplaySettedSignMode();
      }, UTLServ.secondToMillisec(this.#CONFIG.F14_DELAY_SECOND__MSEC));
    },
  };

  //@ +AppQRStation.controlSettedSignModeSuccess 
  controlSettedSignModeSuccess = {
    display: () => {
      Props.displaySettedSignModeSuccess();
    },
    refreshUnDisplay: () => {
      if (this.#timerUnDisplaySettedSignMode) {
        clearTimeout(this.#timerUnDisplaySettedSignMode);
      }
    },
    unDisplay: () => {
      this.#timerUnDisplaySettedSignMode = setTimeout(() => {
        Props.unDisplaySettedSignModeSuccess();
      }, UTLServ.secondToMillisec(this.#CONFIG.SCAN_DELAY_SECOND__MSEC));
    },
  };

  //@ +AppQRStation.controlScannedSign
  controlScannedSign = {
    display: (context) => {
      let gtm = this.utlServ.getTimeMan(context.scanTime);
      let regisDate = gtm.datem;
      let regisTime = gtm.timem;

      //+Dispay Scanned Sign
      Props.displayScannedSign({
        sannedTime: context.scanTime,
        regisDate: regisDate,
        regisTime: regisTime,
        fullname: `${context.name} ${context.surname}`,
        cardId: `${context.cardId}`,
        sign: context.sign,
      });
    },
    refreshUnDisplay: () => {
      if (this.#timerUnDisplayScannedSign) {
        clearTimeout(this.#timerUnDisplayScannedSign);
      }
    },
    unDisplay: () => {
      this.#timerUnDisplayScannedSign = setTimeout(() => {
        Props.unDisplayScannedSign();
      }, UTLServ.secondToMillisec(this.#CONFIG.SCAN_DELAY_SECOND__MSEC));
    },
  };
}

new AppQRStation();
