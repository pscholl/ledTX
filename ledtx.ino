static uint8_t bitcnt = 0;
static uint16_t bytecnt = 0;
static char arr[] = "hello world!\n";

void setup() {
  // put your setup code here, to run once:
  pinMode(10, OUTPUT);
  digitalWrite(10, HIGH);
}

void loop() {
  bytecnt %= sizeof(arr)-1;
  bitcnt  %= 8;

  if (arr[bytecnt] & (1<<bitcnt)) 
    digitalWrite(10, HIGH);
  else
    digitalWrite(10, LOW);

  bitcnt++;
  bytecnt += (bitcnt==8);
  
  delay(230); // roughly delay to 4.25Hz
}
