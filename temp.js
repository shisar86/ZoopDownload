function getTimeDifference(date1, date2) {
  // Get the difference in milliseconds
  var diff = date2 - date1;

  // Convert milliseconds to seconds
  var diffInSeconds = diff / 1000;

  // Convert seconds to minutes
  var diffInMinutes = diffInSeconds / 60;

  // Convert minutes to hours
  var diffInHours = diffInMinutes / 60;

  // Convert hours to days
  var diffInDays = diffInHours / 24;

  // If the difference is less than a minute
  if (diffInSeconds < 60) {
    return Math.floor(diffInSeconds) + " seconds ago";
  }

  // If the difference is less than an hour
  else if (diffInMinutes < 60) {
    return Math.floor(diffInMinutes) + " minutes ago";
  }

  // If the difference is less than a day
  else if (diffInHours < 24) {
    return Math.floor(diffInHours) + " hours ago";
  }

  // If the difference is more than a day
  else {
    return Math.floor(diffInDays) + " days ago";
  }
}
console.log(
  getTimeDifference(
    new Date("01 Jan 1970 00:00:00 GMT "),
    new Date("01 Jan 1970 00:50:50 GMT")
  )
);
