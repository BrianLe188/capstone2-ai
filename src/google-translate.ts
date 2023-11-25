import { v2 } from "@google-cloud/translate";

export const translate = new v2.Translate({
  projectId: "admission-406203",
  credentials: {
    type: "service_account",
    project_id: "admission-406203",
    // private_key_id: "c9c3dda295fb06b85b0855a61706d6203e80fb0d",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6R1xVn//kBh14\nL1fBlsL0fNbFW754+jV6AmdxXpV1zLKDG1Zu3aq7DchDD+YlcM8fsV11Q2DNJCDV\npd0zBZo+oE/v9MBdHfe6xWiCCfrP+S95qa5iwi1SEThB3QVychmH+2HVM0Z3bix8\nkRyLVbcz0YdKMeTFvqdjuh5DCdbdOhSF4ZVggkd9Oqukezay62KudVniH2FMuM8M\n8TH+4NFpRdcBD736n+w0kwljDevDaJeNSrKttCHm1XoXvRa6GMa2bFhOVu6SpGaf\nbYCfBc+wVioLWZzhKTmVIdw1SKIHU7CaBO54ow5D2vs617xGwZVkcPHktNrXTW8A\ndi8DXWhJAgMBAAECggEAFODhswEra7HZxLo9skeFE2UYp2c4ipO0wbeaQ4Uv6FOo\noHREdEmpFK0fSJD0ITcrJ+i3ymhiZavKeFfOWqUinClYvFLo6qbsuMTeiVC4CW5r\nCU5g6tXLwZqHfS5aKXErdmfRF9XW7JTvLIkRM3bIgWjXKpQ8CYPsfAuEz8u/Bu2F\n8qo7GBiEtGN2DSdhrT1ipJfngV57fCVuH86VxYg4XP/g/IluuLCdFVnuYcEobWBS\n04D1A3c7qseBP2SgSicKmmU3sLsIjIqUULsVjdX8OJB2QKMAmYGorP6LFy1uXBlO\nPaqlv6HEieScmSYWAKrqojewyneqEaagx3NKGRObmQKBgQDuUd0DD8N/xzMEzRtM\n/SXrs4ix94wSjqIkIzfv8HAZ0on/kL3GJSQbW9czH3ySvATk9EwLsbzVduDUfL5C\n7+RtAbexRmLk0R1KoHBMxll/NTwmy8fIOaLG6cRhWP5OGSQaJG3D5H6WUC5kbtw8\nzx6qpQJMN+YYMc8UZjRZRi3HfQKBgQDIGSQsMJdM82E4uYbh7xl6U56Iimddf2Br\nwRRtHG7xgQNSbousPLx9gENmeNYnv3uHY1lIS8jEe2ptArMkMw94B1gjBCoDUsQW\nLriszO1GcSUr5h1vxu9Bu52acgulhCUnxc35EA46PfjKqfGYSj7UwIBVegxgSQJE\ntpa/lAl1vQKBgQC8a77ol8MCuJSuvBdUpGUh2F1AD68QUPMCzVGBg8CtudbfVymj\nimPkuZUIV2GfhcX82uVw7YKV5xpVBZdLxuz7/jqkjzjLHkYhZX3ERaImwAkhx0Xa\nGS+IQvS/3qOZTalMffbGxVYMM7KqNzgrX7ooQrPxXNSv1lmaEEBdQO4a5QKBgFTZ\nRFtwp1e8BEfXc/iuOLGEb78aYUZmUu6eSxkRa4IA4PW9ZoC8qHjXQL1dFAJ60djR\nKfTcHeAjLTfYYzpAZJjTFG6Uv3P1TqzRVwH/S8YJCGgbBfR1+NJ4yhXJsmKXLGI3\nIGYyhrXvvWXCtm2LXiU9E64rOMBDdTDJ9BZ8oZ5JAoGAKH/rdOkUxw5qS65OlKIi\nW5enQAlLEmiPK63DDEn2BXt3GCzgFMTOcqR9p8AzpbPDxsmp1j8eIV5XqaBKvbmV\nU6ezRfJphcRpMuRb+urjlf6h/nD/D2o7cxRw0J2kTPMOGIq8aD5jO/Unr1IkpbG1\nUssY9LvDaP+BpoAQu/1WIPU=\n-----END PRIVATE KEY-----\n",
    client_email:
      "admission-translate@admission-406203.iam.gserviceaccount.com",
    client_id: "106550057183764084156",
    // auth_uri: "https://accounts.google.com/o/oauth2/auth",
    // token_uri: "https://oauth2.googleapis.com/token",
    // auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    // client_x509_cert_url:
    // "https://www.googleapis.com/robot/v1/metadata/x509/admission-translate%40admission-406203.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  },
});
