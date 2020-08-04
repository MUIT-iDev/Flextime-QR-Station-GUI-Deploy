
/*^
 * QR Station System
 * Author: NRK, 
 * Date: 02-06-2020
 * 
 */

 /*^
 * Modification
 * Author: NRK,
 * Date: 04-08-2020 
 * Add feature apply out-of-service
 * 
 */


/**
 * Class Props
 * - Property of app-qr-station
 */
class Props {

  //static consts
  static consts = {
    STATION_MODE: {ACTIVE:'ACTIVE', INACTIVE:'INACTIVE', OUTOFSERVICE: 'OUTOFSERVICE'}
  }

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

  static text  = {
    scan: {
      please: "กรุณา Scan QR Code เพื่อลงเวลา",
    },
    save: {
      success: "บันทึกสำเร็จ (Save Successfully)"
    }
  }

  static delayUnDisplaySettedSignMode = 5000;
  static delayUnDisplayScannedSign = 5000;

  static dispayStationActive(){
    $("#station-load").remove();
    $("#station-active").show();
    $("#station-in-active").hide();
    $("#station-out-of-sevice").hide();
  }

  static dispayStationInActive(){
    $("#station-load").remove();
    $("#station-in-active").show();
    $("#station-active").hide();
    $("#station-out-of-sevice").hide();
  }

  static dispayStationOutOfService(){
    $("#station-load").remove();
    $("#station-out-of-sevice").show();
    $("#station-in-active").hide();
    $("#station-active").hide();

  }


  //@ +Props.displaySettedSignMode: แสดงผลการ Set Sign Mode
  static displaySettedSignMode(signMode) {
    //Set style btn click active & diable all
    $(`button[${this.prop.set}="${this.opt.signMode}"][${this.prop.mode}="${signMode}"]`).addClass('btn-light font-weight-bold text-primary');
    $(`button[${this.prop.set}="${this.opt.signMode}"]`).prop("disabled", true);
   
    let sign = this.opt.sign[signMode];
    $(`#${this.opt.disp.status}`)
      .removeClass("alert-danger alert-success")
      .addClass("alert-primary")
      .show().html(`
      <span class="font-smb">Set - ${sign.userkey} (${sign.mode.toUpperCase()})</span>
    `);
  }

  //@ +Props.unDisplaySettedSignMode: แสดงผลการสิ้นสุด Set Sign Mode
  static unDisplaySettedSignMode(signModeSelect) {
    $(`button[${this.prop.set}="${this.opt.signMode}"]`).removeClass('btn-light font-weight-bold text-primary');
    $(`button[${this.prop.set}="${this.opt.signMode}"]`).prop("disabled", false);
    $(`#${this.opt.disp.status}`).empty().hide();
  }

  //@ +Props.displaySettedSignMode: แสดงผลการ Set Sign Mode + Suscess
  static displaySettedSignModeSuccess() {
    $(`#${this.opt.disp.status}`)
      .removeClass("alert-danger alert-primary")
      .addClass("alert-success")
      .show().html(`
          <span class="font-smlb">${this.text.save.success}</span>
    `);
  }

  //@ +Props.unDisplaySettedSignModeSuccess: แสดงผลการสิ้นสุด Set Sign Mode + Suscess
  static unDisplaySettedSignModeSuccess() {
    $(`#${this.opt.disp.status}`).empty().hide();
  }

  //@ +Props.displayScannedSign: แสดงผลการสแกน QR Code เพื่อลงเวลา
  static displayScannedSign(data) {
    let signMode = data.sign.mode.toUpperCase();
    let time = data.regisTime.split(':');
    $(`#${this.opt.disp.sign}`).html(`<span class="font-smb">Time     : </span> <span class="font-mdb text-primary">${time[0]}</span><span class="font-mdb text-primary">:${time[1]}</span><span class="font-smb text-primary">:${time[2]}</span><br/>
    <span class="font-smb">Name  : </span> <span class="font-md text-primary">${data.fullname} </span><br/>
    <span class="font-smb">Card Id   : </span> <span class="font-sm text-primary">${ data.cardId} </span><br/>
    <span class="font-smb">Sign Mode : </span> <span class="font-sm text-primary">${data.sign.userkey ? data.sign.userkey.toUpperCase() +" (" + signMode +")": signMode} </span> <br/>
    `);
  }

  //@ +Props.displayScannedSign: แสดงผลการสิ้นสุดการสแกน QR Code เพื่อลงเวลา
  static unDisplayScannedSign() {
    $(`#${this.opt.disp.sign}`).html(`<p class="font-sml">${this.text.scan.please}</p>`);
  }

  //@ +Props.displayCheckOnlineData: แสดงผล CheckOnline

  static displayCheckOnlineData(data) {
    $("#nav-bottom-stationName").html(data.stationName);

    let onlineStatus = (data.onlineStatus)?'online':'offline';
    let onlineClass = (data.onlineStatus)?'badge badge-pill badge-success':'badge badge-pill badge-danger';
    $("#nav-bottom-onlineStatus").html(onlineStatus).removeClass().addClass(onlineClass);

    $("#nav-bottom-peopleOnStation").html(`| <strong>Sys-info</strong> - User: ${data.peopleOnStation}`);

    $("#nav-bottom-transactionRecord").html(`,Trans: ${data.transactionRecord}`);

    $("#nav-bottom-limitRecord").html(`, LimitTrans: ${data.limitRecord}`);
  }

  static displaySystemVersion(systemVersion){
    $("#nav-bottom-sysVersion").html(`v.${systemVersion}`);
  }

  static displayLocation(data){
    $("#nav-bottom-sysLocation").html(`${JSON.stringify(data)}`);
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
  work = true;
  preventQRScan = false;
  signMode = Props.opt.sign.IN.mode;
  actionScanDo = undefined; // ({QR.scanned, QR.status}) => { //actionScanDo }

  constructor() {
    this.audioQRStationNotReady = new Audio("audio/qr-station-not-ready.m4a");
    this.init();
  }

  //@ +QR.init
  init() {
    let self = this;
    //###################################//
    //Bind QR-Scanner key each-text-of-code to #scanned and request API-transaction(in setTimeByQRCode function) after end of text-of-code.
    $(document).on("keypress", function (e) {
      if(self.work){
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
            if (self.actionScanDo) {
              self.actionScanDo({
                  qr: Base64.encode(self.#scanned), // from script/base64.js
                  status: self.signMode,
              });
            }
            //Clear QR props
            self.#scanned = "";
            self.signMode = self.#defaultSignMode;
          }, 500);
        } else {
          self.audioStationNotReadyOnKeypress();
        }
      }else{
        self.audioStationNotReadyOnKeypress();
      }
      e.preventDefault();
    });
    //###################################//
  }

  audioStationNotReadyOnKeypress(){
    if(this.#preventQRScanCount==0){
      this.audioQRStationNotReady.play();
      this.#preventQRScanCount++;
      setTimeout(()=>{this.#preventQRScanCount=0}, 2500);
    }else{
      return;
    }
  }
}

/***
 * Class AppQRStation
 * - Appilication QR Station
 */
class AppQRStation {

  //@ AppQRStation #properties
  #letCheckFullScreen = true;

  #CONFIG = {
    CHECK_ONLINE_PERIOD__MSEC: 1000*60*5,
    REFRESH_GUI_PERIOD: {
      HOUR: 2, 
      MINUTE: 0, 
      SECOND: 0
    },
    F14_DELAY_SECOND__MSEC: 1000*7,
    SCAN_DELAY_SECOND__MSEC: 1000*7,
    STATION_MODE: Props.consts.STATION_MODE.ACTIVE, /**User ser destroy or active or out-of-service */
    STATION_NAME : "Untitle",
    SYSTEM_VERSION : "20200720"
  }

  #timerUnDisplayScannedSign = null;
  #timerUnDisplaySettedSignMode = null;

 

  constructor() {
   
   
    this.utlServ = new UTLServ();
    this.apiServ = new APIServ({
      callbackError: ()=> {
       //refresh UnDisplay signMode
       this.controlSettedSignMode.refreshUnDisplay();
       //UnDisplay signMode
       this.controlSettedSignMode.unDisplay();
      }
    });
    this.audioRecordSuccess = new Audio("audio/qr-station-scan-success.m4a");
    this.init();
  }

  //@ +AppQRStation.init
  init() {
    let self = this;
    
     //Get updateConfig
     this.controlGetUpdateConfig();


     //Refresh UI/System checking
     window.setInterval( () => {
       // Set interval for refresh checking
     let date = new Date();
    
       //condition currentTime == REFRESH_GUI_PERIOD
       if (date.getHours() === this.#CONFIG.REFRESH_GUI_PERIOD.HOUR && date.getMinutes() === this.#CONFIG.REFRESH_GUI_PERIOD.MINUTE) {
         //BlockUI and Display message
         BlockUI.load({ css: { width: "550px" },message: "Refreshing system, please wait...", overlayCSS: { cursor: "default" } });
         self.qr.preventQRScan = true;
          // Reload web-app in 10 millisec
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
    this.#CONFIG.CHECK_ONLINE_PERIOD__MSEC)  // Repeat every 60000 milliseconds (1 minute) * 5 (= 5 minute)


    this.qr = new QR();
    this.timeServ = new TimeServ();
    Props.dispayStationActive()

    Props.unDisplayScannedSign();
    Props.unDisplaySettedSignMode();

    //Bind click to signMode button
    $(`button[${Props.prop.set}="${Props.opt.signMode}"]`).each(function () {
      $(this).text(
        `${$(this).attr(Props.prop.userkey)} (${$(this).attr(Props.prop.mode).toUpperCase()})`
      );
    });
    $(`button[${Props.prop.set}="${Props.opt.signMode}"]`).on("click", function () {
        self.controlSetSignMode(this);
      }
    );

    //QR.actionScanDo ({QR.scanned, QR.status})
    this.qr.actionScanDo = (data) => {
      if(!this.qr.preventQRScan){
          this.apiServ.transaction.setData(data,  (jqXHR ) => {
              Props.unDisplayScannedSign();
              Props.unDisplaySettedSignMode();
              BlockUI.load({message: "Processing..."})
          })
          .done((resp) => {
            let sign = Props.opt.sign[data.status];
            Object.assign(resp.context, {
              sign: { userkey: sign.userkey, mode: sign.mode },
            });
            this.apiServ.handleDone(resp, (resp) => {
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
              this.controlSettedSignMode.refreshUnDisplay();
              this.controlSettedSignMode.unDisplay();
            });
          })
          .always(() => {
              if(!this.qr.preventQRScan){
                BlockUI.unload();
              }
          });

        }
    }

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

    Props.displaySystemVersion(this.#CONFIG.SYSTEM_VERSION);
    Props.displayLocation(this.apiServ.gethostName);

  }

 

  //@ +AppQRStation.checkOnline
  checkOnline() {
    this.apiServ.checkOnline(
      ()=>{$("#nav-bottom-load-checkOnline").html("Chk-Onl..").show().fadeOut( 5000, "linear")}
    ).done((resp)=>{
      if(resp.status){
         Props.displayCheckOnlineData(resp.context);
         //GET STATION_NAME
         this.#CONFIG.STATION_NAME = resp.context.stationName;

         //GET STATION_MODE
         this.#CONFIG.STATION_MODE = (resp.context.stationMode).toUpperCase();

        switch(this.#CONFIG.STATION_MODE){
          case  Props.consts.STATION_MODE.INACTIVE: this.qr.work=false; Props.dispayStationInActive(); break;
          case  Props.consts.STATION_MODE.OUTOFSERVICE: this.qr.work=false; Props.dispayStationOutOfService(); break;
          default: this.qr.work=true; Props.dispayStationActive();
        }
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

  //@ +AppQRStation.controlGetUpdateConfig
  controlGetUpdateConfig() {
    this.apiServ.configs.getSettingGui(
      ()=>{$("#nav-bottom-load-settingGui").html("Upd-Conf..").show().fadeOut( 5000, "linear")}
    ).done((resp)=>{
        
        //GET CHECK_ONLINE_PERIOD & conv to CHECK_ONLINE_PERIOD__MSEC (millisec)
        this.#CONFIG.CHECK_ONLINE_PERIOD__MSEC = UTLServ.minuteToMillisec(Number(_.find(resp.context, ['name', 'CHECK_ONLINE_PERIOD']).value));

        //GET REFRESH_GUI_PERIOD
        let REFRESH_GUI_PERIOD = _.find(resp.context, ['name', 'REFRESH_GUI_PERIOD']).value;
        let refreshTime = REFRESH_GUI_PERIOD.split(":");

        $.extend(this.#CONFIG.REFRESH_GUI_PERIOD, {
          HOUR: Number(refreshTime[0]), 
          MINUTE: Number(refreshTime[1]), 
          SECOND:  Number(refreshTime[2])
        });

        //GET F14_DELAY_SECOND & conv to F14_DELAY_SECOND__MSEC (millisec)
        this.#CONFIG.F14_DELAY_SECOND__MSEC = UTLServ.secondToMillisec(Number(_.find(resp.context, ['name', 'F14_DELAY_SECOND']).value));
        
        //GET SCAN_DELAY_SECOND  & conv to SCAN_DELAY_SECOND__MSEC (millisec)
        this.#CONFIG.SCAN_DELAY_SECOND__MSEC = UTLServ.secondToMillisec(Number(_.find(resp.context, ['name', 'SCAN_DELAY_SECOND']).value));
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
      }, this.#CONFIG.F14_DELAY_SECOND__MSEC);
    },
  };

  //@ +AppQRStation.controlSettedSignModeSuccess 
  controlSettedSignModeSuccess = {
    display: () => {
      Props.displaySettedSignModeSuccess();
    }
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
      }, this.#CONFIG.SCAN_DELAY_SECOND__MSEC);
    },
  };
}

new AppQRStation();
