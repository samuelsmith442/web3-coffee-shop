import {
  createWalletClient,
  custom,
  formatEther,
  parseEther,
  defineChain,
  createPublicClient,
} from "https://esm.sh/viem"
import "https://esm.sh/viem/window"
import { abi, contractAddress } from "./constants-js.js"
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

// Toast notification function using Toastify JS
function showAlert(message, type = 'error', duration = 5000) {
  // Define colors and icons based on type
  let backgroundColor, textColor, icon
  
  switch (type) {
    case 'error':
      backgroundColor = '#FEE2E2' // light red
      textColor = '#991B1B' // dark red
      icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
      break
    case 'success':
      backgroundColor = '#D1FAE5' // light green
      textColor = '#065F46' // dark green
      icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
      break
    case 'warning':
      backgroundColor = '#FEF3C7' // light yellow
      textColor = '#92400E' // dark yellow
      icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      break
    case 'info':
    default:
      backgroundColor = '#DBEAFE' // light blue
      textColor = '#1E40AF' // dark blue
      icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
      break
  }
  
  // Create toast notification
  return Toastify({
    text: `<div class="flex items-center">${icon}<span>${message}</span></div>`,
    duration: duration,
    close: true,
    gravity: "top", // top or bottom
    position: "center", // left, center, right
    stopOnFocus: true, // Prevents dismissing of toast on hover
    className: "rounded-lg shadow-lg",
    style: {
      background: backgroundColor,
      color: textColor,
      minWidth: "300px",
      maxWidth: "500px",
      padding: "12px 16px",
      fontSize: "14px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    },
    escapeMarkup: false,
    onClick: function(){} // Callback after click
  }).showToast()
}

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")
const ethAmountInput = document.getElementById("ethAmount")

let walletClient
let publicClient

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    walletClient = createWalletClient({
      transport: custom(window.ethereum),
    })
    await walletClient.requestAddresses()
    connectButton.innerHTML = "Connected"
  } else {
    connectButton.innerHTML = "Please install MetaMask"
  }
}

async function fund() {
  // Get ETH amount and ensure it's properly trimmed
  const ethAmount = ethAmountInput.value ? ethAmountInput.value.trim() : ""
  
  // Enhanced validation for ETH amount
  if (!ethAmount) {
    showAlert("Please enter an ETH amount", "warning")
    ethAmountInput.focus()
    return
  }
  
  // Validate numeric value
  const numAmount = Number(ethAmount)
  if (isNaN(numAmount)) {
    showAlert("Please enter a valid number for ETH amount", "warning")
    ethAmountInput.focus()
    return
  }
  
  // Validate positive value
  if (numAmount <= 0) {
    showAlert("ETH amount must be greater than 0", "warning")
    ethAmountInput.focus()
    return
  }
  
  console.log(`Funding with ${ethAmount}...`)

  if (typeof window.ethereum !== "undefined") {
    try {
      // Update button state to show processing
      const originalButtonText = fundButton.innerHTML
      fundButton.innerHTML = '<span class="animate-pulse">Processing...</span>'
      
      // Show info alert that transaction is processing
      showAlert("Processing transaction...", "info")
      
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      })
      const [account] = await walletClient.requestAddresses()
      const currentChain = await getCurrentChain(walletClient)

      console.log("Processing transaction...")
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      })
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: "fund",
        account,
        chain: currentChain,
        value: parseEther(ethAmount),
      })
      const hash = await walletClient.writeContract(request)
      console.log("Transaction processed: ", hash)
      
      // Reset button text and show success
      fundButton.innerHTML = originalButtonText
      
      // Clear input field after successful transaction
      ethAmountInput.value = ""
      
      // Show success message with transaction hash
      showAlert(`Transaction successful! Hash: ${hash.slice(0, 10)}...`, "success")
      
      // Update balance display after funding
      await getBalance()
    } catch (error) {
      console.log(error)
      // Reset button and show error
      fundButton.innerHTML = '<i data-lucide="coffee" class="w-5 h-5"></i>Buy Coffee'
      
      // Show styled error message
      showAlert("Transaction failed: " + (error.message || "Unknown error"), "error")
    }
  } else {
    fundButton.innerHTML = "Please install MetaMask"
    showAlert("Please install MetaMask to use this feature", "error")
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // Update button state to show loading
      const originalButtonText = balanceButton.innerHTML
      balanceButton.innerHTML = '<span class="animate-pulse">Loading...</span>'
      
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      })
      const balance = await publicClient.getBalance({
        address: contractAddress,
      })
      const formattedBalance = formatEther(balance)
      console.log(formattedBalance)
      
      // Update the UI with the balance
      const balanceDisplay = document.getElementById("balanceDisplay")
      if (balanceDisplay) {
        balanceDisplay.textContent = `${formattedBalance} ETH`
        
        // Show success message with balance
        showAlert(`Current contract balance: ${formattedBalance} ETH`, "info")
      }
      
      // Reset button text
      balanceButton.innerHTML = originalButtonText
    } catch (error) {
      console.log(error)
      // Show error message
      showAlert("Failed to get balance: " + (error.message || "Unknown error"), "error")
      balanceButton.innerHTML = "Check Balance"
    }
  } else {
    balanceButton.innerHTML = "Please install MetaMask"
    showAlert("Please install MetaMask to use this feature", "error")
  }
}

async function withdraw() {
  console.log(`Withdrawing...`)

  if (typeof window.ethereum !== "undefined") {
    try {
      // Update button state to show processing
      const originalButtonText = withdrawButton.innerHTML
      withdrawButton.innerHTML = '<span class="animate-pulse">Processing...</span>'
      
      // Show info alert that withdrawal is processing
      showAlert("Processing withdrawal...", "info")
      
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      })
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      })
      const [account] = await walletClient.requestAddresses()
      const currentChain = await getCurrentChain(walletClient)

      console.log("Processing transaction...")
      const { request } = await publicClient.simulateContract({
        account,
        address: contractAddress,
        abi,
        functionName: "withdraw",
        chain: currentChain,
      })
      const hash = await walletClient.writeContract(request)
      console.log("Transaction processed: ", hash)
      
      // Reset button text
      withdrawButton.innerHTML = originalButtonText
      
      // Show success message
      showAlert(`Withdrawal successful! Hash: ${hash.slice(0, 10)}...`, "success")
      
      // Update balance after withdrawal
      await getBalance()
    } catch (error) {
      console.log(error)
      // Reset button and show error
      withdrawButton.innerHTML = "Withdraw"
      showAlert("Withdrawal failed: " + (error.message || "Unknown error"), "error")
    }
  } else {
    withdrawButton.innerHTML = "Please install MetaMask"
    showAlert("Please install MetaMask to use this feature", "error")
  }
}

async function getCurrentChain(client) {
  const chainId = await client.getChainId()
  const currentChain = defineChain({
    id: chainId,
    name: "Custom Chain",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["http://localhost:8545"],
      },
    },
  })
  return currentChain
}

// Event listeners
connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw
