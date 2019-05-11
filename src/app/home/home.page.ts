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
  //Variables para peso ideal
  data2: tarjetNewModel;
  //Verificar si ya termino
  cont: number = 0;
  error: number = 0;

  constructor(private fire: AngularFirestore /*, public file: File*/) {

  }

  descargar(contenido: string, nombre: string) {
    document.getElementById('link').setAttribute("download", nombre);
    document.getElementById('link').setAttribute("href", 'data:text/plain;charset=utf-8,'+ encodeURIComponent(contenido));
    document.getElementById('link').click();
  }

  antMediciones() {
    this.cont = 0;
    this.error = 0;

    this.consulta("/meditions/")
    .then(respuesta => this.iterar())
    .catch(error => console.log(error));
  }

  pesoDeseado() {
    this.cont = 0;
    this.error = 0;

    this.consulta("/users/")
    .then(respuesta => this.iterar2())
    .catch(error => console.log(error));
  }

  consulta(coleccion: string) {
    let promise = new Promise((resolve, reject) => {
      this.fire.collection<any>(coleccion).valueChanges().subscribe((data)=>{
        if (data == undefined) {
          let error = new Error("Sin datos a procesar");
          reject(error);
        } else {
          var strObj = JSON.stringify(data);
          var objJson = JSON.parse(strObj);

          this.array = data;
          resolve(data);
        }

      });
    });
    return promise;
  }

  iterar() {
    console.log("Total de reg Meditions: " + this.array.length);

    for (var i=0; i<this.array.length; i++)
    {
      let item = this.array[i];

      //console.log(item);

      this.getUnit(item["user_uid"])
      .then(respuesta => this.spliceData(item, respuesta))
      .catch(error => console.log(error));
    }
  }

  iterar2() {
    console.log("Total de reg Users: " + this.array.length);

    for (var i=0; i<this.array.length; i++)
    {
      let item = this.array[i];

      if (item["weight"] !== undefined && item["weight_unity"] !== undefined) {
        this.cont++;
        console.log(this.cont);
        console.log(item)

        let idDoc = this.fire.createId();
        this.data2 = this.newTarjet(idDoc, item["created_at"], item["uid"], "weight", item["weight"], item["weight_unity"])

        this.fire.doc("/tarjetNewModel/" + idDoc).set(this.data2);
      } else {
        this.error++;
        console.log(this.error);
      }
    }

    this.descargar(JSON.stringify(this.array), "Users");
    console.log("FINALZO USERS");
    console.log(this.cont + " >> Registros exitosos");
    console.log(this.error + " >> Registros no contienen medida o unidad de medida");
  }

  getUnit = (user_id:string) => {
    let promise = new Promise((resolve, reject) => {
      let unit = "";

      this.fire.collection<any>("/users/").doc(user_id).valueChanges().subscribe((data)=>{
        if (data != undefined) {
          var strObj = JSON.stringify(data);
          var objJson = JSON.parse(strObj);
          unit = objJson.weight_unity;
          resolve(unit);
        } else {
          let error = new Error("No existe el usuario: " + user_id);
          this.error++;
          console.log("ERROR: " + this.error);
          reject(error);
        }
      });
    });
    return promise;
  }

  spliceData(item2, unit) {
    this.cont++;

    console.log("<< " + item2["user_uid"]);

    for (var key in item2) {
      var arre = ["uid", "medition_type", "created_at", "user_uid"];
      if (arre.indexOf(key) == -1 && item2[key] != null && item2[key] != "0" && item2[key] != "0.00") {
        //console.log(key + " --> " + item[key]);
        let idDoc = this.fire.createId();
        this.data = this.newMedition(idDoc, item2["created_at"], item2["user_uid"], key, item2[key], unit, item2["medition_type"])

        //this.fire.doc("/meditionsNewModel/" + idDoc).set(this.data);
      }
    }

    console.log("CONT: " + this.cont);
    if ((this.cont + this.error) == this.array.length) {
      this.descargar(JSON.stringify(this.array), "Meditions");
      console.log("FINALIZO MEDITIONS");
      console.log(this.cont + " >> Registros exitosos");
      console.log(this.error + " >> Registros no existentes en usuarios");
    }
  }

  newMedition(id:string, effectiveDateTime:string, subject:string, key:string, value:number, unit: string, medition_type:number): meditionsNewModel {
    return {
      _id: id,
      effectiveDateTime: effectiveDateTime,
      subject: subject,
      code: {
        text: key,
      },
      valueQuantity: {
        value: value,
        unit: this.GetMeasure(key, unit)
      },
      deviceName: {
        name: this.getDevice(medition_type)
      }
    };
  }

  newTarjet(id:string, effectiveDateTime:string, subject:string, key:string, value:number, unit: string): tarjetNewModel {
    return {
      _id: id,
      effectiveDateTime: effectiveDateTime,
      subject: subject,
      code: {
        text: key,
      },
      valueQuantity: {
        value: value,
        unit: unit
      }
    };
  }

  GetMeasure(key: string, unit: string): string {
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

  getDevice(medition_type: number): string {
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
