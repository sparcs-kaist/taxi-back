# Taxi backend documentation

## /Rooms
### create (POST)
* 접근 : `/create`
* 요청을 받아 room을 생성
* request JSON form
    ```javascript
    {
        name : String,
        from : String,
        to : String,
        time : Date,
        part : Array
    }
    ```
* Return values
    - 200 "add room successful"
    - 500 "internal server error"
    <br>
### delete (GET)
* 접근 : `/:id/delete`
* ID를 받아 해당 ID의 room을 제거
* Parameters
    - id : 삭제할 room의 ID
* Return values
    - 200 "Delete room successful"
    - 404 "ID does not exist"
    - 500 "Internal server error"
    <br>
### edit (POST)
* 접근 : `/:id/edit`
* ID와 수정할 데이터를 JSON으로 받아 해당 ID의 room을 수정
* Parameters
    - id : 삭제할 room의 ID
* request JSON form
    ```javascript
    {
        name : String,
        from : String,
        to : String,
        time : Date,
        part : Array
    }
    ```
* Return values
    - 400 "Bad request"
    - 200 "edit room successful"
    - 404 "id does not exist"
    - 500 "internal server error"  
    <br>
### :id (GET)
* 접근 : `/:id`
* ID를 parameter로 받아 해당 ID의 room의 정보 출력
* Parameters
    - id : 조회할 room의 ID
* Return values
    - 200 with JSON :
        ```javascript
        {
            error : false,
            message : "Rooms/info : room info successful",
            data : [result]
        }
    - 404 "id does not exist"
    - 500 "internal server error"
    <br>
### /invite (POST)
* 접근 : `/invite`
* room의 ID와 user들의 ID list를 받아 해당 room의 participants에 추가한다.
* request JSON form
    ```javascript
    {
        roomId : ObjectID,
        users : List[ObjectID]
    }
    ```
* Return values
    - 400 "Bad request"
    - 404 "no corresponding room"
    - 409 "{userID} Already in room"
    - 200 "invite successful"
    - 500 "internal server error"
    <br>
### /search (POST)
* 접근 : `/search`
* 출발지/도착지/날짜를 받아 해당하는 room들을 반환한다.
* request JSON form
    ```javascript
    {
        fromName : String,
        toName : String, 
        startDate : Date
    }
    ```
* Return values
    - 400 "Bad request, from/to location not given"
    - 404 "no corresponding location"
    - 200 with JSON :
        ```javascript
        {
            error : false,
            message : "search successful",
            data : [result]
        }
    - 500 "internal server error"
    <br>

