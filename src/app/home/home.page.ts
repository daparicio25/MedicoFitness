import { Component } from '@angular/core';

//FIREBASE
import { AngularFirestore } from 'angularfire2/firestore';
//import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {

  //Variables para Meditions
  array = [];
  data : meditionsNewModel;
  dataSend: meditionsNewModel[] = [];

  constructor(private fire: AngularFirestore /*, public file: File*/) {

  }

  descargar(contenido: string, nombre: string) {
    document.getElementById('link').setAttribute("download", nombre);
    document.getElementById('link').setAttribute("href", 'data:text/plain;charset=utf-8,'+ encodeURIComponent(contenido));
    document.getElementById('link').click();
  }

  antMediciones() {
    this.proceso()
    .then(respuesta => this.imprimir())
    .catch(error => console.log(error));
  }

  proceso() {
    let promise = new Promise((resolve, reject) => {
      var array = [];
      var user_id = "0y4D63eHSZJGuZW8cmme";
      console.log("user_id: " + user_id);

      this.fire.collection<any>("/meditions/").doc(user_id).valueChanges().subscribe((data)=>{
        console.log("* MEDITIONS *");
        console.log(data);

        if (data == undefined) {
          let error = new Error("Sin datos a procesar");
          reject(error);
        } else {
          var strObj = JSON.stringify(data);
          var objJson = JSON.parse(strObj);
          array[0] = data;
          this.array = array;
          resolve(array);
        }

      });
    });
    return promise;
  }

  imprimir() {
    let item;
    let unit = "";
    for (var i=0; i<this.array.length; i++)
    {
      item = this.array[i];

      this.getUnit(item["user_uid"])
      .then(respuesta => this.spliceData(item, respuesta))
      .catch(error => console.log(error));
    }
  }

  getUnit = (user_id:string) => {
    let promise = new Promise((resolve, reject) => {
      let unit = "";
      console.log("user_id: " + user_id);

      this.fire.collection<any>("/users/").doc(user_id).valueChanges().subscribe((data)=>{
        console.log("* USUARIO *");

        if (data != undefined) {
          console.log(data);
          var strObj = JSON.stringify(data);
          var objJson = JSON.parse(strObj);
          unit = objJson.weight_unity;
          resolve(unit);
        } else {
          let error = new Error("No existe el usuario: " + user_id);
          reject(error);
        }
      });
    });
    return promise;
  }

  spliceData(item, unit) {
    console.log("\n------------");
    console.log("Unit: " + unit);

    for (var key in item) {
      var arre = ["uid", "medition_type", "created_at", "user_uid"];
      if (arre.indexOf(key) == -1 && item[key] != null && item[key] != "0" && item[key] != "0.00") {
        console.log(key + " --> " + item[key]);
        let idDoc = this.fire.createId();
        this.data = this.nuevoDato(idDoc, item["created_at"], item["user_uid"], key, item[key], unit, item["medition_type"])

        //console.log(this.data);
        this.fire.doc("/prueba/" + idDoc).set(this.data);
      }
    }
  }

  nuevoDato(id:string, effectiveDateTime:string, subject:string, key:string, value:number, unit: string, medition_type:number): meditionsNewModel {
    return {
      _id: id,
      effectiveDateTime: effectiveDateTime,
      subject: subject,
      code: {
        text: key,
      },
      valueQuantity: {
        value: value,
        unit: this.obtenerMedida(key, unit)
      },
      deviceName: {
        name: this.obtenerDisp(medition_type)
      }
    };
  }

  obtenerMedida(key: string, unit: string): string {
    let meditions = "";

    switch(key) {
      case "weight":
      case "muscle_mass":
      case "bonne_mass":
        meditions = "kg";
        break;
      case "bmi":
        meditions = "kg/m²";
        break;
      case "tmb":
        meditions = "Kcal";
        break;
      case "visceral_fat":
      case "body_fat":
      case "body_water":
        meditions = "%";
        break;
      case "metabolic_age":
        meditions = "";
        break;
      case "diastolic_pressure":
      case "systolic_pressure":
        meditions = "mmHg";
        break;
      case "heart_rate":
        meditions = "lat/min";
        break;
      case "glucose":
      case "urico_acid":
      case "cholesterol":
        meditions = "mg/dl";
        break;
      case "stomach":
      case "hip":
      case "chest":
      case "biceps":
      case "thigh":
      case "calf":
      case "neck":
      case "size":
      case "head":
      case "height_baby":
        meditions = "cm";
        break;
      default:
        console.log("\n--- DEFAULT ERROR ---");
    }

    if (unit.toLowerCase() == "lb") {
      if (meditions.toLowerCase() == "kg") { meditions = "lb"; }

      if (meditions.toLowerCase() == "cm") { meditions = "in"; }
    }
    return meditions;
  }

  obtenerDisp(medition_type: number): string {
    let device = "";

    switch(medition_type) {
      case 1:
        device = "Scale MedicoFitness";
        break;
      case 2:
        device = "Heart MedicoFitness";
        break;
      case 3:
        device = "GCU MedicoFitness";
        break;
      case 5:
          device = "Corporal MedicoFitness";
          break;
    }

    return device;
  }

}

interface meditionsNewModel {
  _id: string;
  effectiveDateTime?:string;
  subject:string;
  code?: Icode;
  valueQuantity?: IvalueQuantity;
  deviceName?: IdeviceName;
}

interface tarjetNewModel {
  _id: string;
  effectiveDateTime?:string;
  subject:string;
  code?: Icode;
  valueQuantity?: IvalueQuantity;
}

interface Icode {
  text?:string;
}

interface IvalueQuantity {
  value?: number;
  unit?: string;
}

interface IdeviceName {
  name?: string;
}
