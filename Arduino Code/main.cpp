#include <Arduino.h>
#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

Servo servo1;
Servo servo2;
Servo servo3;

const int xAxisPin = A2;
const int yAxisPin = A3;

// LiquidCrystal_I2C lcd = LiquidCrystal_I2C(0x27, 16, 2);

void setup() {
  Serial.begin(9600);
  
  servo1.attach(2);
  servo2.attach(4);
  servo3.attach(7);

  // lcd.init();
  // lcd.backlight();
  // lcd.setCursor(0, 0);
  // lcd.print("test");
}

int servo1Value = 0;
int servo2Value = 0;
int servo3Value = 90;

String lastSerial = "";

void loop() {
  int xPosition = analogRead(xAxisPin);
  int yPosition = analogRead(yAxisPin);
  
  if(xPosition - 510 < -100){
    servo1Value -= 1;
    if(servo1Value < 0){
      servo1Value = 0;
    }
  } else if(xPosition - 510 > 100){
    servo1Value += 1;
    if(servo1Value > 1023){
      servo1Value = 1023;
    }
  }

  if(yPosition - 510 < -100){
    servo2Value -= 1;
    if(servo2Value < 0){
      servo2Value = 0;
    }
  } else if(yPosition - 510 > 100){
    servo2Value += 1;
    if(servo2Value > 180){
      servo2Value = 180;
    }
  }

  if(Serial.available() > 0) {
    String str = Serial.readStringUntil('\n');
    if(str == "test"){
      servo1Value = 90;
    }
    double xValue = str.toDouble();
    if(xValue > 250){
      servo3Value -= (xValue - 250) / 10;
      if(servo3Value < 0){
        servo3Value = 0;
      }
    } else {
      servo3Value += (250 - xValue) / 10;
      if(servo3Value > 250){
        servo3Value = 250;
      }
    }
  }

  servo1.write(servo1Value);
  servo2.write(servo2Value);
  servo3.write(servo3Value);
  delay(8);
}