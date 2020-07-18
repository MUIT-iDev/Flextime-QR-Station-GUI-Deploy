/***
 * Class BlockUI (static)
 * - BlockUI-Custom
 */
class BlockUI {

  //@  BlockUI #properties (static)
  static #defaultSetting = {
    onBlock: null,
    onUnblock: null,
    css: {
      width: "200px",
      border: "none",
      padding: "10px",
      backgroundColor: "#000",
      "-webkit-border-radius": "10px",
      "-moz-border-radius": "10px",
      opacity: 0.5,
      color: "#333",
    },
    overlayCSS: {
      backgroundColor: "#000",
      opacity: 0.6,
      cursor: "wait",
    },
    ignoreIfBlocked: false,
  };

  //@  BlockUI +properties (static)
  static setting = {};

  //@ +BlockUI.load
  static load(setting) {
    //Re setting to default value (copy value type extend-deep https://api.jquery.com/jQuery.extend/#jQuery-extend-deep-target-object1-objectN)
    $.extend(true, this.setting, this.#defaultSetting);

    //Assign setting from user
    if (setting) {
      $.extend(true, this.setting, setting);
    }

    $.blockUI({
      css: this.setting.css,
      overlayCSS: this.setting.overlayCSS,
      message: "<h4>" + this.setting.message + "</h4>",
      onBlock: this.setting.onBlock,
      onUnblock: this.setting.onUnblock,
      ignoreIfBlocked: this.setting.ignoreIfBlocked,
    });

    $('.blockUI.blockMsg').center();
  }

  //@ +BlockUI.unload
  static unload() {
    $.unblockUI();
  }

}

/***
 * Class HTTPServ
 * NRK, 02-06-2020
 */
class HTTPServ {
  httpSetup = {callbackError: ()=>{}};
  constructor(httpSetup) {
    if(httpSetup){
     $.extend(this.httpSetup, httpSetup);
    }
  }
  //@ HTTPServ +properties
  defaultSetting = {
    url: "",
    method: "GET",
    dataType: "json",
    data: {},
    async: true,
    beforeSend:  () => {},
    complete:  () => {},
    success: () => {},
    error: (jqXHR, textStatus, errorThrown) => {
      $("#disp-status")
        .removeClass("alert-primary alert-sucess")
        .addClass("alert-danger")
        .show()
        .empty()
        .html(
          `<span class="text-danger font-sxl">
            <strong>- HTTP Request error, Msg: </strong> ${
              jqXHR.message ? jqXHR.message : "Unknown"
            },
            <strong>Status:</strong> ${jqXHR.statusText},
            <strong>TextStatus:</strong> ${textStatus},
            <strong>Response:</strong> ${
              jqXHR.responseText ? jqXHR.responseText : "Unknown"
            }
            </span><br/>`
        );
          this.httpSetup.callbackError();
        
    },
    fail: (jqXHR, textStatus) => {},
  };
  //@ HTTPServ +properties
  setting = {};

  

  //@ +HTTPServ.ajax
  ajax(setting) {
    $.extend(this.setting, this.defaultSetting)
    if (setting) {
      $.extend(this.setting, setting);
    }

    let jqxhr = $.ajax({
      method: this.setting.method,
      url: this.setting.url,
      data: this.setting.data,
      dataType: this.setting.dataType,
      async: this.setting.async,
      beforeSend: this.setting.beforeSend,
      complete: this.setting.complete,
      success: this.setting.success,
      error: this.setting.error,
    });
    return jqxhr;
  }
}

/***
 * UTLServ (Utility Service)
 */
class UTLServ {

   //@ +UTLServ.getTimeMan : Convert databasetimestamp to human-time 
  getTimeMan(timeDB) {
    let listTime = timeDB.split(" ");
    let listDate = listTime[0].split("-");
    let datem = listDate.reverse().join("/");
    let timem = listTime[1];
    return {
      datem: datem,
      timem: timem,
    };
  }

  static secondToMillisec(second){
    return second*1000;
  }

  static  minuteToMillisec(minute){
    return minute*60000;
  }
  
  //@ +UTLServ.getTimeMan : View in fullscreen
  static openFullscreen() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  }

  //@ +UTLServ.closeFullscreen : Close fullscreen
  static closeFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE/Edge */
      document.msExitFullscreen();
    }
  }
}

/***
 * TimeServ
 */
class TimeServ {

  //@ TimeServ +properties
  setting = {
    locales: "en-GB",
    //locales: "th-TH",
  };

  day = {
    TH: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"],
    EN: [
      "Sunday",
      "Monday",
      "Tueday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saterday",
    ],
    ENS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  };

  constructor(setting) {
    if (setting) {
      Object.assign(this.setting, setting);
    }
  }

  //@ +TimeServ.currentTime
  currentTime() {
    let d = new Date();
    let n = d.getDay();
    //get Date
    let dateSys = d.toLocaleDateString(this.setting.locales);
    //get Day of Week
    let daySys = this.day.TH[n] + ' ['+ this.day.ENS[n] + ']';
    //get Time
    let timeStr = d.toLocaleTimeString(this.setting.locales);
    let timeSys = timeStr.split(':');
    //Render Day, Date & Time
    document.getElementById('day-sys').innerHTML=daySys;
    document.getElementById('date-sys').innerHTML=dateSys;
    document.getElementById('hour-sys').innerHTML=timeSys[0];
    document.getElementById('minute-sys').innerHTML=timeSys[1];
    document.getElementById('second-sys').innerHTML=timeSys[2];
  }

  //@ +TimeServ.clockDisp
  clockDisp() {
    this.currentTime();
    setInterval(() => {
      this.currentTime();
    }, 1000);
  }
}

/***
 * Class APIServ extends HTTPServ
 */
class APIServ extends HTTPServ {

  //Final Version - DomainUI: flextime.station
  //Final Version - DomainAPI: api.flextime.station

 //@ APIServ #properties
  #hostName = {
    app: { 
      prd: "flextime.station",
      qas: "qas.flextime.station",
    },
    api: {
      prd: "api.flextime.station",
      qas: "api.qas.flextime.station",
      dev: "api.dev.flextime.station",
      opts: {
        path: "/api",
        version: "/v1"
      }
    }
  }
  #locationHostname = ""; //get current location
  #apiHostname = "";
  
   //@ APIServ +properties
  gethostName = { }

  constructor(httpSetup) {
    super(httpSetup);
    
    let data = null;

    // try{
    // var urlParams = new URLSearchParams(window.location.search);
    //   data = urlParams.get('server');
    // }catch(e){ }

    this.#locationHostname = window.location.hostname;

    switch (this.#locationHostname) {
      
      case this.#hostName.app.prd:
        this.#apiHostname = `http://${this.#hostName.api.prd}`;
        break;
      case this.#hostName.app.qas:
        this.#apiHostname = `http://${this.#hostName.api.qas}`;
        break;
      default:
        this.#apiHostname = `http://${this.#hostName.api.qas}`;
    }
    this.#apiHostname += `${this.#hostName.api.opts.path}${this.#hostName.api.opts.version}`;
    
    let locationHostname = this.#locationHostname?this.#locationHostname:"localhost";
    let apiHostname = this.#apiHostname;
    Object.assign(this.gethostName, {hostnameApi:  apiHostname, hostnameApp: locationHostname});


    this.audioScanFailQRExpire = new Audio(
      "audio/qr-station-scan-fail-qr-expire.m4a"
    );
    this.audioScanFailDataWrong = new Audio(
      "audio/qr-station-scan-fail-data-wrong.m4a"
    );
    this.audioScanFailQRWrongFormat = new Audio(
      "audio/qr-station-scan-fail-qr-wrong-format.m4a"
    );
    this.audioError = new Audio("audio/qr-station-error.m4a");

  }

  //@ +APIServ.trancaction
  transaction = {
      setData: (data, beforeSend) => {
        return this.ajax({
          method: "POST",
          dataType: "json",
          url: `${this.#apiHostname}/transactions`,
          data: data,
          beforeSend: beforeSend
      });
    }
  }

  //@ +APIServ.configs
  configs = {
    getSettingGui: (beforeSend, complete) => {
      return this.ajax({
        method: "GET",
        dataType: "json",
        async: false,
        url: `${this.#apiHostname}/configs/setting-gui`,
        beforeSend: beforeSend,
        complete: complete
      });
    }
  }

  //@ +APIServ.checkOnline
  checkOnline = (beforeSend, complete) => {
    return this.ajax({
      method: "GET",
      dataType: "json",
      url: `${this.#apiHostname}/checkOnline`,
      beforeSend: beforeSend,
      complete: complete
    });
  };

  //@ +HTTPServ.handleDone
  handleDone(resp, callback) {
    if (resp.status == false) {
      let errorTitle = "Scan Fail";
      let errorMessage = "";

      let listScanError = {
        "00": {
          TH: "การประมวลผลการบันทึกข้อมูลผิดพลาด",
          EN: "Error from Exception",
        }, //[00] : Error from Exception
        "01": { TH: "ไม่พบข้อมูล QR Code", EN: "Don't have QR data." }, //[01] Don't have QR data. : don't have qr data in GUI request body
        "02": {
          TH: "ไม่พบสถานะการลงเวลา",
          EN: "Don't have QR scaning status.",
        }, //[02] Don't have QR scaning status. : don't have scaning status data in GUI request body
        "03": { TH: "QR Code ผิดรูปแบบ", EN: "QR Code Wrong!!! format." }, //[03] QR WRONG!!! format. : qr from GUI is wrong format
        "04": {
          TH: "คุณไม่มีสิทธิ์เข้าในงาน QR Station นี้",
          EN: "Don't have this person data on QR Station.",
        }, //04] Don't have this person data on QR Station. : check qr data with personal in this station, then not found this person
        "05": { TH: "Qr Code หมดอายุ", EN: "QR Code Expire!!!" }, //[05] QR Expire!!! : qr time out
      };

      switch (resp.error) {
        case "01":
        case "02":
        case "04":
          this.audioScanFailDataWrong.play();
          break;
        case "03":
          this.audioScanFailQRWrongFormat.play();
          break;
        case "05":
          this.audioScanFailQRExpire.play();
          break;
        default:
          this.audioError.play();
          errorTitle = "Error Ocorred";
      }

      if (resp.error in listScanError) {
        errorMessage = `${resp.context}`;
      } else {
        let listError = [];
        if (resp.error) {
          listError.push(`Error: ${resp.error}`);
        }
        if (resp.message) {
          listError.push(`Message: ${resp.message}`);
        }
        listError.join(", ");
        errorMessage = listError;
      }
      $("#disp-status")
        .removeClass("alert-primary")
        .addClass("alert-danger")
        .show()
        .html(
          `<span class="text-danger font-sm"> <strong> ${errorTitle}: </strong> ${errorMessage}`
        );
        this.httpSetup.callbackError();
    } else {
      //Call callback that one is undefined
      if (callback) {
        callback(resp);
      }
    }
  }
}