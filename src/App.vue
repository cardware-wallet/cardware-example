<template>
  <div class="min-h-screen bg-cream flex flex-col items-center justify-start pt-8">
    <div class="w-full max-w-sm mx-auto">
      <!-- Initial Screen with Pair Button -->
      <div v-if="!paired && !pairingStarted" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">Welcome to Cardware Wallet</h2>
          <p class="mb-6 text-center text-copper-dark">To get started, pair your device with your Cardware Hardware.</p>
          <button @click="startPairing" class="w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Pair Device
          </button>
        </div>
      </div>

      <!-- Simulated Pairing Screen -->
      <div v-else-if="!paired && pairingStarted" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg h-full">
          <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">Pairing...</h2>
            <div class="bg-white bg-opacity-80 h-80">
              <qrcode-stream @decode="onDecode" @init="onInit" class="w-80 h-80" />
            </div>
          <p class="mt-2 mb-4 text-center text-copper-dark">Pairing with Cardware Hardware....</p>
          <!-- Simulate a loading indicator -->
          <div class="flex justify-center mb-4">
            <div class="loader"></div>
          </div>
          <p class="mb-4 text-center text-copper-dark">{{percentSynced}}</p>
          <button @click="backToPair" class="mt-4 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Back
          </button>
        </div>
      </div>

      <!-- Wallet Overview -->
      <div v-else-if="paired && !sending && !showReceive" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">Cardware Wallet</h2>
          <p class="text-center text-copper-dark mb-2"><strong> {{ balance }} BTC</strong></p>
          <p class="mb-2 text-center text-copper-dark text-sm"><strong></strong> {{ walletAddress }}</p>
          
          <div v-if="showUnconf" class="w-full">
            <p class="text-center text-gray-500 text-sm"><strong>Unconfirmed:</strong> {{ unconfirmedBalance }}</p>
          </div>
          <button @click="startSend" class="mt-4 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300 mb-4">
            Send Bitcoin
          </button>
          <button @click="showReceiveView" class="mb-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300">
            Receive Bitcoin
          </button>
        </div>
      </div>

      <!-- Receive QR Code Screen -->
      <div v-else-if="showReceive" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">Receive Bitcoin</h2>
          <p class="mb-4 text-center text-copper-dark">Scan the QR code below to receive Bitcoin.</p>
          <!-- QR Code Display -->
          <div class="mb-4 flex justify-center">
            <QRCodeVue :value="walletAddress" :size="200" level="H"></QRCodeVue>
          </div>
          <p class="mb-4 text-center text-copper-dark text-sm">{{ walletAddress }}</p>
          <button @click="copyToClipboard" class="mb-2 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Copy
          </button>
          <button @click="backToOverview" class="mt-2 mb-2 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Back
          </button>
        </div>
      </div>

      <!-- Input Form for Address and Amount -->
      <div v-else-if="sending && !psbtGenerated" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">Send Bitcoin</h2>
          <div class="mb-4">
            <label class="block text-copper-dark mb-1" for="recipientAddress">Address</label>
            <input v-model="recipientAddress" id="recipientAddress" type="text" class="w-full px-3 py-2 border rounded" placeholder="Recipient Address">
          </div>
          <div class="mb-4">
            <label class="block text-copper-dark mb-1" for="amount">Amount (BTC)</label>
            <input v-model="amountInput" id="amount" type="number" step="0.00000001" class="w-full px-3 py-2 border rounded" placeholder="Amount" @keyup.enter="handleFirstFee" @blur="handleFirstFee">
          </div>
          <label class="block text-copper-dark mb-2" for="amount">Transaction Fee: {{currentFee}}</label>
          <div class="flex -mx-1 px-1">
            <div v-if="selectedFee==0" class="w-1/3">
              <button @click="adjustFeeRate(0)" class="w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
                Low
              </button>
            </div>
            <div v-else class="w-1/3">
              <button @click="adjustFeeRate(0)" class="w-full bg-gray-200 text-gray-400 py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
                Low
              </button>
            </div>
            <div v-if="selectedFee==1" class="w-1/3 mx-2">
              <button @click="adjustFeeRate(1)" class="w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
                Medium
              </button>
            </div>
            <div v-else class="w-1/3 mx-2">
              <button @click="adjustFeeRate(1)" class="w-full bg-gray-200 text-gray-400 py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
                Medium
              </button>
            </div>
            <div v-if="selectedFee==2" class="w-1/3">
              <button @click="adjustFeeRate(2)" class="w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
                High
              </button>
            </div>
            <div v-else class="w-1/3">
              <button @click="adjustFeeRate(2)" class="w-full bg-gray-200 text-gray-400 py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
                High
              </button>
            </div>
          </div>
          <button @click="generatePSBT" class="mt-4 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Send
          </button>
          <button @click="backToOverview" class="mt-4 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Back
          </button>
        </div>
      </div>

      <!-- Display PSBT QR Code -->
      <div v-else-if="sending && psbtGenerated && !signed" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">Send Bitcoin: ({{qrIndex+1}}/{{chunks.length}})</h2>
          <p class="mb-4 text-center text-copper-dark">Scan the QR Codes with your cardware hardware.</p>
          <!-- QR Code Display -->
          <div class="mb-4 flex justify-center">
            <QRCodeVue :value="qrCodeUrl" :size="300" level="L"></QRCodeVue>
          </div>
          <div class="flex -mx-2 px-1">
            <button @click="prevQR" class="mx-2 m-1 w-1/2 bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
              Prev
            </button>
            <button @click="nextQR" class="mb-1 mt-1 w-1/2 bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
              Next
            </button>

          </div>
          <button @click="nextBroadcast" class="m-1 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Broadcast
          </button>
          
        </div>
      </div>

      <!-- Scan Signed Transaction -->
      <div v-else-if="sending && signed && !transactionComplete" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <!-- Placeholder for scanning -->
           <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">Broadcasting...</h2>
           <h2 class="text-2xl font-bold mb-4 text-center text-copper-dark">{{debugInfo}}</h2>
            <div class="bg-white bg-opacity-80 h-80">
              <qrcode-stream @decode="onDecode" @init="onInit" class="w-80 h-80" />
            </div>
          <p class="mb-4 text-center text-copper-dark">Scan codes to broadcast....</p>
          <!-- Simulate a loading indicator -->
          <div class="flex justify-center mb-4">
            <div class="loader"></div>
          </div>
          <p class="mb-4 text-center text-copper-dark">{{percentSynced}}</p>
          <button @click="backToPSBT" class="mt-4 w-full bg-copper text-white py-2 px-4 rounded hover:bg-copper-dark transition duration-300">
            Back
          </button>
        </div>
      </div>

      <!-- Transaction Complete -->
      <div v-else-if="transactionComplete" class="transition duration-500 ease-in-out transform mt-4">
        <div class="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4 text-center text-green-600">Transaction Complete</h2>
          <p class="mb-6 text-center text-green-500">Your transaction has been broadcast successfully!</p>
          <p class="mb-6 text-center text-green-500 text-xs"><strong>TXID: </strong>{{abbreviateString(txidStr,15)}}</p>
          <button @click="openTxInExplorer" class="mb-2 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300">
            Open in Explorer
          </button>
          <button @click="backToWallet" class="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300">
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { Wallet } from 'cardware-btc';
  import QRCodeVue from 'qrcode.vue';
  import { QrcodeStream } from 'vue3-qrcode-reader';

  const paired = ref(false);
  const pairingStarted = ref(false);
  const walletAddress = ref('');
  const currentFee = ref('');
  const balance = ref(0);
  const unconfirmedBalance = ref(0);
  const sending = ref(false);
  const signed = ref(false);
  const showUnconf = ref(false);
  const selectedFee = ref(1);
  const txidStr = ref('');
  let qrCodeUrl = ref("");
  let debugInfo = ref("");
  const transactionComplete = ref(false);
  let wallet = null;
  let interval;
  const psbtGenerated = ref(false);
  const psbtText = ref("");
  const percentSynced = ref('0 %');
  const recipientAddress = ref('');
  const amountInput = ref('');
  const showReceive = ref(false);

  let pairStrings = ["","",""];
  let chunks =[];
  let broadcastStrings =[];
  const chunkSize = 46;
  let qrIndex = 0;
  let currentIndex = 0;
  let pairPercent = 0;
  let pairScan = false;
  let firstTime = false;
  let totalBCodes = 0;
  let totalScanned =0;
  let lastIndex =0;
  let feeInSats;
  const decodedText = ref('');
  const isCameraActive = ref(false);

  const onDecode = async(result) => {
    if(pairScan){
      await continueToPair(result);
    }else{
      await continueToBroadcast(result);
    }
  };

  const onInit = (promise) => {
    promise.then(() => {
      isCameraActive.value = true;
    }).catch((error) => {
      console.error(error);
    });
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const startPairing = async () => {
    pairingStarted.value = true;
    pairStrings = ["","",""];
    pairPercent = 0;
    pairScan = true;
  };

  const handleFirstFee = () => {
    if (!recipientAddress.value || !amountInput.value) {
      return;
    }
    adjustFeeRate(selectedFee.value);
  }

  const adjustFeeRate = (newRate) => {
    selectedFee.value = newRate;
    if (!recipientAddress.value || !amountInput.value) {
      return;
    }
    let blocks = 1;
    switch(newRate){
      case 0: blocks = 144; break;
      case 1: blocks = 18; break;
      case 2: blocks = 1; break;
    }
    let amountInSats = BigInt(Math.floor(amountInput.value*100000000));
    let amounts = [amountInSats];
    let recipients = [recipientAddress.value];
    let fee = wallet.estimate_fee(recipients, amounts, blocks);
    let feeString = (Number(fee)/100000000).toFixed(8);;
    currentFee.value = feeString + " BTC";
    feeInSats = BigInt(fee);
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress.value);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy value: ', err);
    }
  };

  const nextBroadcast = () =>{
    signed.value = true;
    pairPercent = 0;
    pairScan = false;
    firstTime = true;
  }

  const nextQR = () =>{
    qrIndex++;
    if(qrIndex == chunks.length){
      qrIndex = 0;
    }
    qrCodeUrl.value = chunks[qrIndex];
  }

  const prevQR= () =>{
    qrIndex--;
    if(qrIndex == -1){
      qrIndex = chunks.length-1;
    }
    qrCodeUrl.value = chunks[qrIndex];
  }

  const showReceiveView = () => {
    showReceive.value = true;
  };

  const backToOverview = () => {
    showReceive.value = false;
    sending.value = false;
    transactionComplete.value = false;
  };

  const backToWallet = async () => {
    txidStr.value = "";
    showReceive.value = false;
    sending.value = false;
    transactionComplete.value = false;
    await syncUpdate();
  };

  const backToPair = () => {
    pairingStarted.value = false;
  }

  const backToPSBT = () => {
    signed.value = false;
    qrIndex = 0;
  }

  const continueToBroadcast = async(qrString) => {
    if(qrString.length > 0){
      let parts = qrString.split(":");
      let sub_parts = parts[0].split("/");
      if(firstTime){
        totalBCodes = Number(sub_parts[1]);
        broadcastStrings = new Array(totalBCodes).fill(null);
        firstTime = false;
      }
      let index = Number(sub_parts[0]);
      index--;
      if(broadcastStrings[index] == null){
        totalScanned++;
        let pairIncrease = 100/totalBCodes;
        pairPercent += pairIncrease;
        pairPercent = Math.round(pairPercent);
        percentSynced.value = pairPercent + " %";
        broadcastStrings[index] = parts[1];
        debugInfo.value = parts[1];
      }
      if(totalScanned == totalBCodes){
        pairPercent = 100;
        let finalString = "";
        for(let i = 0; i < broadcastStrings.length; i++){
          finalString += broadcastStrings[i];
        }
        
        
        
        transactionComplete.value = true;
        let res = await wallet.broadcast(finalString);
        txidStr.value = res;
      }
    }
  }

  const continueToPair = async(qrString) =>{
    if(qrString.length > 0){
      if(qrString.charAt(0) == '1'){
        let parts = qrString.split(",");
        pairStrings[0] = parts[1];
        pairPercent += 33;
        percentSynced.value = pairPercent + " %";
      }else if(qrString.charAt(0) == '2'){
        let parts = qrString.split(",");
        pairStrings[1] = parts[1];
        pairPercent += 33;
        percentSynced.value = pairPercent + " %";
      }else if(qrString.charAt(0) == '3'){
        let parts = qrString.split(",");
        pairStrings[2] = parts[1];
        pairPercent += 33;
        percentSynced.value = pairPercent + " %";
      }
    }
    if(pairPercent == 99){
      try {
        paired.value = true;
        let fullString = pairStrings[0] + pairStrings[1] + pairStrings[2];
        let parts = fullString.split(":");
        wallet = await new Wallet(
          parts[0],
          "https://blockstream.info/api",
          parts[1],
          "bitcoin"
        );
        await syncUpdate();
      } catch (error) {
        pairingStarted.value = false;
      }
    }
  }
  const callToSync = async () =>{
    await syncUpdate();
  }
  async function syncUpdate(){
    walletAddress.value = "Syncing..."
     balance.value = ""
    await wallet.sync();
    walletAddress.value = wallet.address();
    const balanceSatoshis = wallet.balance();
    balance.value = satoshisToBTC(balanceSatoshis);
    const unconfBalanceSatoshis = wallet.unconfirmed_balance();
    unconfirmedBalance.value = satoshisToBTC(unconfBalanceSatoshis);
    if (unconfBalanceSatoshis != 0){
      showUnconf.value = true;
    }
  }

  function satoshisToBTC(satoshis) {
    const satoshisStr = satoshis.toString();
    const length = satoshisStr.length;
    if (length <= 8) {
      const padded = satoshisStr.padStart(9, '0');
      return `0.${padded.slice(-8)}`;
    } else {
      const integerPart = satoshisStr.slice(0, length - 8);
      const decimalPart = satoshisStr.slice(-8);
      return `${integerPart}.${decimalPart}`;
    }
  }

  function startSend() {
    sending.value = true;
    psbtGenerated.value = false;
  }
  function openTxInExplorer() {
    if(txidStr.value != ""){
      const url = `https://blockstream.info/tx/${txidStr.value}`;
      window.open(url, '_blank');
    }
  }
  function generatePSBT() {
    if (!recipientAddress.value || !amountInput.value) {
      alert('Please enter both recipient address and amount.');
      return;
    }
    let amountInSats = BigInt(Math.floor(amountInput.value*100000000));
    let amounts = [amountInSats];
    let recipients = [recipientAddress.value];
    chunks = wallet.send(recipients, amounts, BigInt(feeInSats));
    console.log(chunks);
    psbtGenerated.value = true;
    qrCodeUrl.value = chunks[0];
    qrIndex = 0;
    /*
    interval = setInterval(() => {
      qrCodeUrl.value = chunks[currentIndex]
      currentIndex = (currentIndex + 1) % chunks.length
    }, 500)
    */
  }
  function abbreviateString(str, numChars) {
    if (str.length <= numChars * 2) {
        return str;
    }
    const start = str.substring(0, numChars);
    const end = str.substring(str.length - numChars);
    return `${start}...${end}`;
  }
  function proceedToScanSigned() {
    signed.value = true;
  }

  function completeTransaction() {
    transactionComplete.value = true;
  }

  function reset() {
    sending.value = false;
    signed.value = false;
    transactionComplete.value = false;
    psbtGenerated.value = false;
    recipientAddress.value = '';
    amountInput.value = '';
  }

</script>

<style>
  .loader {
    border: 8px solid #f3f3f3;
    border-top: 8px solid #fd5d00; /* Copper color */
    border-radius: 50%;
    width: 48px;
    height: 48px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
