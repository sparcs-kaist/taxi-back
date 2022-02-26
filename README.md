# taxiSampleGenerator

이 node 프로그램은 SPARCS-Taxi 프로젝트를 위한 샘플 사용자, 방, 채팅 목록을 생성합니다.
현재 이 프로그램으로 생성된 샘플 채팅 데이터는 입, 퇴장 메시지들과 일반 채팅 메시지들로만 구성되어 있습니다.

**WARNING**  
스크립트 실행 시 기존에 MongoDB에 저장된 사용자, 방, 채팅 정보는 **삭제**됩니다!

**SETUP**

1. 로컬 저장소에 레포지토리를 클론합니다.
2. `npm install`로 필요한 패키지를 설치합니다.
3. 클론한 디렉토리(index.js가 있는 디렉토리)에 .env 파일을 아래와 같이 추가합니다.

```
#mongoDB 경로 (직접 입력해야 함 - 기본값은 mongodb://localhost:27017/local)
DB_PATH=
#방에 참여하는 사용자 목록. 콤마로 구분
USERS="sunday, monday, tuesday, wednesday"
#출발지와 도착지
FROM_LOCATION=택시승강장
TO_LOCATION=대전역
#생성할 방의 개수와 각각의 방의 채팅 개수
NUM_OF_ROOMS=1
NUM_OF_CHATS=200
#각 채팅 사이의 최대 시간 간격(단위: 초; 소수도 가능)
MAXIMUM_INTERVAL_BETWEEN_CHATS=20
#새로운 채팅이 각각 입/퇴장 메시지일 확률(각각 10%)
OCCURENCE_OF_JOIN=0.1
OCCURENCE_OF_ABORT=0.1
```

4. `npm start`또는 `node app.js`로 샘플 채팅 데이터를 만들 수 있습니다.
