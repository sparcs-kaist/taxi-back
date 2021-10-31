// inputArray를 perChunk만큼 잘라서 배열로 반환합니다.

const chunkArray = (inputArray, perChunk) => {
  return inputArray.reverse().reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk)

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].unshift(item)

    return resultArray
  }, [])
}

module.exports = chunkArray;