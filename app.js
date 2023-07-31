const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const formate = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServerDb = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running...");
    });
  } catch (e) {
    console.log(`db error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServerDb();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatusAndCategoryProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityAndCategoryProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (req, res) => {
  let getTodoQuery = "";
  let data = null;
  const { search_q = "", priority, category, status } = req.query;

  switch (true) {
    case hasStatusProperty(req.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
            select * from todo where status='${status}';`;
        data = await db.all(getTodoQuery);
        res.send(data.map((eachData) => outputResult(eachData)));
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;

    case hasPriorityProperty(req.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
            select * from todo where  priority='${priority}';`;
        data = await db.all(getTodoQuery);
        res.send(data.map((eachData) => outputResult(eachData)));
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryProperty(req.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
            select * from todo where category='${category}';`;
        data = await db.all(getTodoQuery);
        res.send(data.map((eachData) => outputResult(eachData)));
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;

    case hasSearchProperty(req.query):
      getTodoQuery = `
            select * from todo where todo like '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      res.send(data.map((eachData) => outputResult(eachData)));

      break;

    case hasPriorityAndCategoryProperty(req.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        (category === "LEARNING" &&
          (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW"))
      ) {
        getTodoQuery = `
            select * from todo where category='${category}' and priority='${priority}';`;
        data = await db.all(getTodoQuery);
        res.send(data.map((eachData) => outputResult(eachData)));
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;

    case hasStatusAndCategoryProperty(req.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        (category === "LEARNING" &&
          (status === "TO DO" || status === "IN PROGRESS" || status === "DONE"))
      ) {
        getTodoQuery = `
            select * from todo where category='${category}' and status='${status}';`;
        data = await db.all(getTodoQuery);
        res.send(data.map((eachData) => outputResult(eachData)));
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;

    case hasStatusAndPriorityProperty(req.query):
      if (
        (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") &&
        (status === "TO DO" || status === "IN PROGRESS" || status === "DONE")
      ) {
        getTodoQuery = `
            select * from todo where status='${status}'
            and priority='${priority}';`;
        data = await db.all(getTodoQuery);
        res.send(data.map((eachData) => outputResult(eachData)));
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;

    // default:
    //   break;
  }
});

app.get("/agenda/", async (req, res) => {
  const { date } = req.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = formate(new Date(date), "yyyy-MM-dd");
    const getTodoDate = `
      select * from todo where due_date='${newDate}';`;
    const dataResult = await db.all(getTodoDate);
    res.send(dataResult.map((eachData) => outputResult(eachData)));
  } else {
    res.status(400);
    res.send("Invalid Due Date");
  }
});

app.post("/todos/", async (req, res) => {
  const { id, todo, category, priority, status, dueDate } = req.body;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = formate(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
          insert into 
          todo(id,todo,priority,category,status,due_date)
          values
          (${id},'${todo}','${category}','${priority}','${status}','${newDate}')`;
          await db.run(postTodoQuery);
          res.send("Todo Successfully Added");
        } else {
          res.status(400);
          res.send("Invalid Due Date");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
    }
  } else {
    res.status(400);
    res.send("Invalid Todo Status");
  }
});

app.put("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const requestBody = req.body;
  const previousTodoQuery = `select * from todo where id = ${todoId};`;
  const previousId = await db.get(previousTodoQuery);
  const {
    todo = previousId.todo,
    priority = previousId.priority,
    category = previousId.category,
    status = previousId.status,
    dueDate = previousId.dueDate,
  } = req.body;

  let updateTodoQuery = null;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
              update todo set todo='${todo}', priority='${priority}', 
              status='${status}', category='${category}', due_date='${dueDate}';`;
        await db.run(updateTodoQuery);
        res.send("Status Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
              update todo set todo='${todo}', priority='${priority}', 
              status='${status}', category='${category}', due_date='${dueDate}';`;
        await db.run(updateTodoQuery);
        res.send("Priority Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
              update todo set todo='${todo}', priority='${priority}',
              status='${status}', category='${category}', due_date='${dueDate}';`;
        await db.run(updateTodoQuery);
        res.send("Category Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;
    case requestBody.todo !== undefined:
      updateTodoQuery = `
              update todo set todo='${todo}', priority='${priority}',
              status='${status}', category='${category}', due_date='${dueDate}';`;
      await db.run(updateTodoQuery);
      res.send("Todo Updated");

      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = formate(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
              update todo set todo='${todo}', priority='${priority}',
              status='${status}', category='${category}', due_date='${newDate}';`;
        await db.run(updateTodoQuery);
        res.send("Due Date Updated");
      } else {
        res.status(400);
        res.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `
    delete from todo where id=${todoId};`;
  await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const getTodoQuery = `
    select * from todo where id =${todoId};`;
  const todoArray = await db.get(getTodoQuery);
  res.send(outputResult(todoArray));
});

module.exports = app;
