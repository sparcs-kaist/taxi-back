# taxiSampleGenerator
This program generates simple sample data for SPARCS Taxi project.

**SETUP**
1. Clone the repostory
2. Install the dependencies (```npm install```)
3. Add .env
```
DB_PATH="mongodb PATH"
NUM_OF_CHATS="number of chats per room e.g.) 200"
NUM_OF_ROOMS="number of rooms e.g.) 1"
```
4. Edit ```index.js``` to modify the list of sample users (edit constant ```userIds```, they should follow the rules of SPARCSSSO Ids)
5. Edit ```src/testData.js``` to modify maximum time intervals between the chats(edit constant ```someMinutes```, in milliseconds)
6. Generate sample users, rooms, chats by executing ```node index.js```
