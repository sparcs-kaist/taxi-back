# taxiSampleGenerator

This program generates simple sample data for SPARCS Taxi project.

**SETUP**

1. Clone the repostory
2. Install the dependencies (`npm install`)
3. Add .env

```
#mongoDB 경로 (직접 입력해야 함 - 기본값은 mongodb://localhost:27017/local)
DB_PATH=
#방에 참여하는 사용자 목록. 콤마로 구분
USERS="sunday, monday, tuesday, wednesday"
#출발지와 도착지
FROM_LOCATION=택시승강장
TO_LOCATION=대전역
#방과 각각의 방의 채팅 개수
NUM_OF_ROOMS=1
NUM_OF_CHATS=200
#채팅 간 최대 시간 간격(단위: 초, 소수도 가능)
MAXIMUM_INTERVAL_BETWEEN_CHATS=20
#새로운 채팅이 각각 입/퇴장 메시지일 확률(각각 10%)
OCCURENCE_OF_JOIN=0.1
OCCURENCE_OF_ABORT=0.1
```

1. Edit `index.js` to modify the list of sample users
2. Edit `src/testData.js` to modify maximum time intervals between the chats
3. Generate sample users, rooms, chats by executing `node index.js`
