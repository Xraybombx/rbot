@ECHO OFF
CALL npm i --include=dev
CALL npm update bedrock-protocol
CALL npm update --depth 9999