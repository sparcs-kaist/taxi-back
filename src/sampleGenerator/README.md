# taxiSampleGenerator

이 node 프로그램은 SPARCS-Taxi 프로젝트를 위한 샘플 사용자, 방, 채팅 목록을 생성합니다.
현재 이 프로그램으로 생성된 샘플 채팅 데이터는 입, 퇴장 메시지들과 일반 채팅 메시지들로만 구성되어 있습니다.

**WARNING**  
스크립트 실행 시 기존에 MongoDB에 저장된 사용자, 방, 채팅 정보는 **삭제**됩니다!

**SETUP**

1. *(optional)* Root directory의 `.env.test` 파일에 다음 내용을 추가합니다.
   ```
   #방과 각각의 방의 채팅 개수
   SAMPLE_NUM_OF_ROOMS=2
   SAMPLE_NUM_OF_CHATS=200
   #채팅 간 최대 시간 간격(단위: 초, 소수도 가능)
   SAMPLE_MAXIMUM_INTERVAL_BETWEEN_CHATS=20
   #새로운 채팅이 각각 입/퇴장 메시지일 확률(각각 10%)
   SAMPLE_OCCURENCE_OF_JOIN=0.1
   SAMPLE_OCCURENCE_OF_ABORT=0.1
   ```
1. sampleData.json에 장소, 유저, 방 데이터를 입력합니다.
   javascript `User { "id": "sampleId", 사용자 id }`

1. `pnpm start`로 샘플 채팅 데이터를 만들 수 있습니다.

1. `pnpm run dumpDB`으로 현재 DB를 덤프할 수 있습니다.
1. `pnpm run restoreDB`로 과거 DB를 덤프 파일로부터 복원할 수 있습니다.
