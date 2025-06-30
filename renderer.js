const closeButton = document.getElementById("close");
const minimizeButton = document.getElementById("minimize");
const fetchButton = document.getElementById("fetch");
closeButton.addEventListener("click", () => {
  console.log("close");
  window.electronAPI.closeWindow();
});

minimizeButton.addEventListener("click", () => {
  console.log("minimize");
  window.electronAPI.minimizeWindow();
});

function getTimeDifference(date1, date2 = 0) {
  if (date2 != 0) var diff = date2 - date1;
  else var diff = date1 / 1000;
  var diffInSeconds = diff / 1000;
  var diffInMinutes = diffInSeconds / 60;
  var diffInHours = diffInMinutes / 60;
  var diffInDays = diffInHours / 24;
  var seconds = Math.round(diffInSeconds % 60);
  var minutes = Math.round(diffInMinutes % 60);
  var hours = Math.round(diffInHours % 24);
  var days = Math.round(diffInDays);

  if (days > 0) {
    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  } else if (hours > 0) {
    return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  } else if (minutes > 0) {
    return `${minutes} minutes, ${seconds} seconds`;
  } else {
    return `${seconds} seconds`;
  }
}

var repSpeed = 0;
try {
  fetchButton.addEventListener("click", async () => {
    console.log("fetch");
    const url = document.getElementById("url").value;
    console.log(url);
    const data = await window.electronAPI.fetchURL(url);
    console.log(data);
    if (data.status) handleFetchResponse(data);
    else errored("Invalid URL");
  });
} catch {}

// fetchButton.addEventListener("click", async () => {
//   const filePath = await window.electronAPI.fileOpen();
//   console.log(filePath);
// });
function formatFileSize(bytes, decimalPoint) {
  if (bytes == 0) return "0 Bytes";
  var k = 1024,
    dm = decimalPoint || 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getFileSize() {
  return localStorage.getItem("CurrentBSize");
}

function estimatedDownloadTime(fileSize, downloadSpeed) {
  // Calculate download time in seconds
  var downloadTime = fileSize / downloadSpeed;
  // Convert download time to days
  var days = Math.floor(downloadTime / 86400);
  // Calculate remaining time in seconds
  var remainingTime = downloadTime % 86400;
  // Convert remaining time to hours
  var hours = Math.floor(remainingTime / 3600);
  // Calculate remaining time in seconds
  remainingTime = remainingTime % 3600;
  // Convert remaining time to minutes
  var minutes = Math.floor(remainingTime / 60);
  var seconds = Math.floor(remainingTime % 60);
  // Initialize a variable to hold the estimated time
  var estimatedTime = "";
  // Add days to the estimated time if they are not zero
  if (days > 0) {
    estimatedTime += days + " days ";
  }
  // Add hours to the estimated time if they are not zero
  if (hours > 0) {
    estimatedTime += hours + " hours ";
  }
  // Add minutes to the estimated time if they are not zero
  if (minutes > 0) {
    estimatedTime += minutes + " minutes ";
  }
  if (seconds > 0) {
    estimatedTime += seconds + " seconds Left ";
  }
  // Return the estimated time
  return estimatedTime;
}

var speedavg = [],
  q;
window.electronAPI.downloading((event, chunk, total, tim, chunkStatus) => {
  document.getElementById("downloadedSize").innerText = formatFileSize(
    total.bytes,
    2
  );
  repSpeed += 1;
  speedavg.push(total.speed);
  document.getElementById("Percentage").innerHTML = `${parseInt(
    total.percentage
  )}.<span id="PercentageBase" class="text-base font-semibold">${
    total.percentage.toFixed(2).split(".")[1]
  }</span>%`;
  if (repSpeed % 20 == 0) {
    document.getElementById("Elapsed").innerText = tim;
    q = speedavg.reduce((a, b) => a + b, 0) / speedavg.length;
    document.getElementById("timeLeft").innerText = estimatedDownloadTime(
      getFileSize() - total.bytes,
      q.toFixed(0)
    );
    document.getElementById("totalSpeed").innerText = formatFileSize(q, 2);
    speedavg = [];
  }
  for (var i = 1; i <= 8; i++) {
    const bar = document.getElementById(`p${i}`);
    bar.style.width = `${chunk[i - 1].percentage.toFixed(0)}%`;
    // Show chunk status visually (green if done, gray if not)
    if (chunkStatus && chunkStatus[i - 1]) {
      bar.style.backgroundColor = '#22c55e'; // green for done
    } else {
      bar.style.backgroundColor = '#d1d5db'; // gray for not done
    }
  }
  // Show resume button if not all chunks are done
  if (chunkStatus && chunkStatus.some((done) => !done)) {
    let resumeBtn = document.getElementById('resumeDownload');
    if (!resumeBtn) {
      resumeBtn = document.createElement('button');
      resumeBtn.id = 'resumeDownload';
      resumeBtn.innerText = 'Resume Download';
      resumeBtn.className = 'btn bg-primary text-white my-4';
      resumeBtn.onclick = () => {
        window.location.reload(); // reload to trigger resume
      };
      document.getElementById('downloading').appendChild(resumeBtn);
    }
  } else {
    const resumeBtn = document.getElementById('resumeDownload');
    if (resumeBtn) resumeBtn.remove();
  }
  if (total.percentage == 100) {
    success("Downloaded Successfully");
    localStorage.setItem("DownloadSet", false);
  }
});

window.electronAPI.error((event, error) => {
  errored("Unable to Download Try again :-(");
});

function errored(data) {
  Swal.fire({
    title: "Error!",
    text: data,
    icon: "error",
    confirmButtonText: "Ok",
  });
}
function classifyFile(fileName) {
  // Get the file extension
  const extension = fileName.split(".").pop().toLowerCase();

  // Define a list of known file extensions
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp"];
  const videoExtensions = ["mp4", "mkv", "mov", "avi", "wmv"];
  const audioExtensions = ["mp3", "wav", "aac", "flac", "ogg"];
  const documentExtensions = ["doc", "docx", "pdf", "txt", "rtf"];
  const programExtensions = ["exe", "msi", "dmg", "deb"];
  const compressedExtensions = ["zip", "rar", "7z", "tar", "gz"];

  // Check if the file extension is in the list of known image extensions
  if (programExtensions.includes(extension)) {
    return { type: "program", color: "#5f5af6" };
  }
  if (imageExtensions.includes(extension)) {
    return { type: "image", color: "#f000b9" };
  }
  if (videoExtensions.includes(extension)) {
    return { type: "video", color: "#ff9800" };
  }
  if (audioExtensions.includes(extension)) {
    return { type: "audio", color: "#0ea5e9" };
  }
  if (documentExtensions.includes(extension)) {
    return { type: "document", color: "#10b981" };
  }
  if (compressedExtensions.includes(extension)) {
    return { type: "compressed", color: "#ff5724" };
  } else {
    return { type: "unknown", color: "#313e59" };
  }
}
function success(data) {
  var t = [
    localStorage.getItem("CurrentFName"),
    localStorage.getItem("CurrentSize"),
    classifyFile(localStorage.getItem("CurrentFName")),
    localStorage.getItem("CurrentFPath"),
  ];
  Swal.fire({
    title: "Downloaded",
    text: data,
    icon: "success",
    confirmButtonText: "Ok",
  }).then((isConfirm) => {
    if (isConfirm) {
      try {
        var s = JSON.parse(localStorage.getItem("Downloaded"));
        s.push(t);
      } catch (e) {
        s = [t];
      }
      console.log(t);
      console.log(s);
      localStorage.setItem("Downloaded", JSON.stringify(s));
      console.log(localStorage.getItem("Downloaded"));
      window.location.href = "Downloaded.html";
    }
  });
}
