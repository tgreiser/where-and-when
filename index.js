// Initiate DAppClient
const client = new beacon.DAppClient({
    name: 'H=N Assistant', // Name of the DApp,
    preferredNetwork: 'mainnet',
    //matrixNodes: ['matrix.papers.tech']
    // matrixNodes: ['beacon.tztip.me']
  })

  // Display the active account in the UI
  const updateActiveAccount = () => {
    client.getActiveAccount().then((activeAccount) => {
      if (activeAccount) {
        document.getElementById('activeAccount').innerHTML = activeAccount.address
        document.getElementById('requestPermission').style.display = 'none';
        document.getElementById('account').style.display = 'block';
        document.getElementById('reset').style.display = 'block';
        fetchSwaps();
      } else {
        document.getElementById('activeAccount').innerHTML = ''
        document.getElementById('requestPermission').style.display = 'block';
        document.getElementById('account').style.display = 'none';
        document.getElementById('reset').style.display = 'none';
        //document.getElementById('activeAccountNetwork').innerHTML = ''
        //document.getElementById('activeAccountTransport').innerHTML = ''
      }
    })
  }
  updateActiveAccount()

  // Initiate a permission request
  const requestPermission = (callback) => {
    client
      .requestPermissions(/*{ network: { type: beacon.NetworkType.DELPHINET } }*/)
      .then((permissions) => {
        console.log('permissions', permissions)
        if (callback) {
          callback(permissions)
        }
        updateActiveAccount()
      })
      .catch((error) => {
        console.log('error during permission request', error)
      })
  }

  const cancelSwap = (swapId) => {
    client
      .requestOperation({
        operationDetails: [
          {
            kind: beacon.TezosOperationType.TRANSACTION,
            amount: '0',
            destination: 'KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9',
            parameters: {
              entrypoint: 'cancel_swap',
              value: {
                int: swapId
              }
            }
          }
        ]
      })
      .then((response) => console.log(response))
      .catch((error) => console.log(error))
  }

  // Add event listener to the button
  document.getElementById('requestPermission').addEventListener('click', () => {
    requestPermission()
  })

  // Add event listener to the button
  document.getElementById('reset').addEventListener('click', () => {
    client.destroy().then(() => {
      window.location.reload()
    })
  })

  document.getElementById('cancelSwaps').addEventListener('click', () => {
    const rows = table.getSelectedRows();
    for (var iX = 0; iX < rows.length; iX++) {
      cancelSwap(rows[iX].getData()['id']);
    }
  })

  var table;
  const fetchSwaps = () => {
    const address = document.getElementById('activeAccount').innerHTML;
    fetch('https://staging.api.tzkt.io/v1/bigmaps/523/keys?sort.desc=id&active=true&value.issuer='+address)
        .then(response => response.json())
        .then(data => {
            document.getElementById('cancelSwaps').style.display = 'block';
            var tabledata = [];
            for (var iX = 0; iX < data.length; iX++) {
                console.log(data[iX]);
                tabledata.push({
                  id: data[iX]['key'],
                  objkt_id: data[iX]['value']['objkt_id'],
                  qty: data[iX]['value']['objkt_amount'],
                  price_in_xtz: data[iX]['value']['xtz_per_objkt'] / 1000000,
                });
            }
            table = new Tabulator("#swaps", {
           //   height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
              data:tabledata, //assign data to table
              layout:"fitColumns", //fit columns to width of table (optional)
              columns:[ //Define Table Columns
                {formatter:"rowSelection", titleFormatter:"rowSelection", hozAlign:"center", headerSort:false, width: 60, cellClick:function(e, cell){
                  cell.getRow().toggleSelect();
                }},
                {title:"Swap", field:"id", width:150},
                {title:"OBJKT", field:"objkt_id"},
                {title:"Qty", field:"qty"},
                {title:"XTZ", field:"price_in_xtz"},
              ],
              initialSort:[
                {column:"objkt_id", dir:"desc"}, //sort by this first
                {column:"id", dir:"desc"}, //then sort by this second
              ]
            });
        });
  }