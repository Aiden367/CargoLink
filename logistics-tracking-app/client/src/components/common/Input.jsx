import React from "react";

export const Input = ({label,type = "text",value,onChange,placeholder,error}) => {
    return(
     <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input-field ${error ? "input-error" : ""}`}
      />
     </div>
    )
}
