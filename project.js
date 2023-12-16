function strongPasswordChecker(password) {
  let steps = 0;
  

  if (password.length < 6) {
    steps += 6 - password.length;
  } else if (password.length > 20) {
    steps += password.length - 20;
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);

  if (!hasLowercase) steps++;
  if (!hasUppercase) steps++;
  if (!hasDigit) steps++;


  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      steps++;
      password = password.slice(0, i + 2) + password.slice(i + 3);
      i--;
    }
  }


  let replaceSteps = 0;
  for (let i = 0; i < password.length - 1; i++) {
    if (password[i] === password[i + 1]) {
      replaceSteps++;
      i++;
    }
  }

  steps = Math.max(steps, replaceSteps);

  return steps;
}


console.log(strongPasswordChecker("a"));    
console.log(strongPasswordChecker("aA1"));  


