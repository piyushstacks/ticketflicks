import dns from 'dns';
console.log("Testing DNS resolution for _mongodb._tcp.cluster99.57yjjst.mongodb.net");
dns.resolveSrv('_mongodb._tcp.cluster99.57yjjst.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("DNS Error:", err);
  } else {
    console.log("DNS Success:", addresses);
  }
});
