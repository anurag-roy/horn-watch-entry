import React, { useState } from "react";
import axios from "axios";

import StockInputForm from "./StockInputForm";
import SelectedStock from "./SelectedStock";

import { Button, TextField } from "@material-ui/core";
import green from "@material-ui/core/colors/green";

import "./InputForm.css";
import "./StockInputForm.css";

const InputForm = () => {
  const [state, setState] = useState("initial");

  const [stockA, setStockA] = useState();
  const [stockB, setStockB] = useState();
  const [stockC, setStockC] = useState();
  const [stockD, setStockD] = useState();

  const [entryPrice, setEntryPrice] = useState();

  const proceedButton = () => {
    if (!stockA || !stockB || !stockC || !stockD) {
      alert("One or more invalid stocks selected. Please select valid stocks and try again.");
    } else if (!entryPrice) {
      alert("Missing entry price. Please input entry price and try again.");
    } else {
      axios
        .post("http://localhost:4001/watchHornEntry", {
          stockA,
          stockB,
          stockC,
          stockD,
          entryPrice,
        })
        .then((data) => console.log(data))
        .catch((error) => console.error(error));
      setState("done");
    }
  };

  if (state === "initial") {
    return (
      <div>
        <div className="form_container">
          <StockInputForm label="A" tType="SELL" handleChange={setStockA} />
          <StockInputForm label="B" tType="BUY" handleChange={setStockB} />
          <StockInputForm label="C" tType="BUY" handleChange={setStockC} />
          <StockInputForm label="D" tType="SELL" handleChange={setStockD} />
          <div className="input_container">
            <div className="input_element">
              <h3>Entry Price:</h3>
            </div>
            <div className="input_element">
              <TextField
                id="entryPrice"
                error={!Number(entryPrice)}
                label="Entry Price"
                variant="outlined"
                value={entryPrice}
                onChange={(event) => {
                  setEntryPrice(event.target.value);
                }}
              />
            </div>
          </div>
        </div>
        <div className="input_container">
          <div className="input_element">
            <SelectedStock input={"A"} data={stockA} />
          </div>
          <div className="input_element">
            <SelectedStock input={"B"} data={stockB} />
          </div>
          <div className="input_element">
            <SelectedStock input={"C"} data={stockC} />
          </div>
          <div className="input_element">
            <SelectedStock input={"D"} data={stockD} />
          </div>
        </div>
        <div className="input_container">
          <Button
            variant="contained"
            size="large"
            style={{ background: green[600], color: "white" }}
            onClick={proceedButton}
          >
            Watch Market
          </Button>
        </div>
      </div>
    );
  } else {
    return <div>Check Console</div>;
  }
};

export default InputForm;
