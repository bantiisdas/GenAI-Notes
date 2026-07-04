document.getElementById("addTaskBtn").addEventListener("click", function() {  
var taskInput = document.getElementById("taskInput");  
var taskText = taskInput.value.trim();  
if(taskText !== "") {  
var li = document.createElement("li");  
li.textContent = taskText;  
document.getElementById("taskList").appendChild(li);  
taskInput.value = "";  
}  
}); 
