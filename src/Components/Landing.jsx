import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css"
import CodeEditor from './CodeEditor';
import OutputDetails from './OutputDetails';
import OutputWindow from './OutputWindow';
import axios from 'axios';
import UseKeyPress from '../Hooks/UseKeyPress';
import LanguageDropdown from './LanguageDropdown';
import CustomInput from './CustomInput';
import { classnames } from '../Utils/general';
import { LanguageOption } from '../Constants/LanguageOption';
import SaveCodeDropdown from './SaveCodeDropdown';
import { AlignmentType, Document,HeadingLevel,Packer,Paragraph, TextRun } from 'docx';
import {saveAs} from 'file-saver';
import jsPDF from 'jspdf';
const javascriptDefault = `
console.log("Hello world")`;

const Landing = () => {
  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [language, setLanguage] = useState(LanguageOption[0]);
  const enterpress = UseKeyPress("Enter");
  const ctrlpress = UseKeyPress("Control");
  const [fileFormat,setFileFormat]=useState('');

  const onSelectChange = (selectedOption) => {
    console.log("Selected Option...", selectedOption);
    setLanguage(selectedOption);
  };
  const onSelectChangeFormat=(selectedOption)=>{
    if(selectedOption==='.docx' || selectedOption==='.pdf'){
      setFileFormat(selectedOption);
    }
  }

  useEffect(() => {
    if (enterpress && ctrlpress) {
      console.log("Enter pressed", enterpress);
      console.log("Control pressed", ctrlpress);
      
    }
  }, [ctrlpress, enterpress]);

  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("Case not handled!", action, data);
      }
    }
  };

  const handleCompile = () => {
    setProcessing(true);
    const formData = {
      language_id: language.id,
      source_code: btoa(code),
      stdin: btoa(customInput),
    };

   const options = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions',
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "content-type": "application/json",
        "Content-Type": "application/json",
        "X-RapidAPI-Host": 'judge0-ce.p.rapidapi.com',
        "X-RapidAPI-Key": 'd733c648f1mshe43d60590914b45p1a1572jsncc8aa30644b5',
      },
      data: formData,
    };


    axios.request(options).then(function (response) {
      console.log("res.data", response.data);
      const token = response.data.token;
      CheckStatus(token);
    }).catch((err) => {
      let error = err.response ? err.response.data : err;
      let status = err.response.status;
      console.log("status", status);

      if (status === 429) {
        console.log("Too many requests", status);
        showErrorToast(
          `Quota of 100 requests exceeded for the Day!`,
          10000
        );
      }

      setProcessing(false);
      console.log("Catch block:", error);
    });
  };

  const CheckStatus = async (token) => {
     const options = {
      method: "GET",
      url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "X-RapidAPI-Host": 'judge0-ce.p.rapidapi.com',
        "X-RapidAPI-Key": 'd733c648f1mshe43d60590914b45p1a1572jsncc8aa30644b5',
      },
    };



    try {
      let response = await axios.request(options);
      let statusId = response.data.status.id;
      

      if (statusId === 1 || statusId === 2) {
        setTimeout(() => {
          CheckStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        showSuccessToast('Compiled Successfully');
        console.log('response.data', response.data);
        return;
      }
    } catch (err) {
      console.log("Error", err);
      setProcessing(false);
      showErrorToast();
    }
  };

  const showSuccessToast = (msg) => {
    toast.success(msg || 'Compiled Successfully', {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const showErrorToast = (msg) => {
    toast.error(msg || `Something went wrong! Please try again.`, {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };
  const saveFile=()=>{
    if(fileFormat==='.docx'){
      const codeLines=code.split('\n');
      const doc=new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text:"EXPERIMENT-",
                heading:HeadingLevel.HEADING_3,
                alignment:AlignmentType.CENTER,
                children  :[
                  new TextRun({
                    bold:true,
                    italics:false,
                  })
                ]
              }),
              new Paragraph({
                text:""
            }),
              new Paragraph({
                text:"Aim:",
                heading:HeadingLevel.HEADING_4,
               
                children  :[
                  new TextRun({
                    
                    bold:true,
                    italics:false,
                  })
                ]
              }),
              new Paragraph({
                text:""
            }),
              new Paragraph({
                text:"Source Code:",
                heading:HeadingLevel.HEADING_4,
                
                children  :[
                  new TextRun({
                    
                    bold:true,
                    italics:false,
                  })
                ]
              }),
              
             ...codeLines.map((line)=>new Paragraph({
              text:line,
              spacing:{after:200}
             })),
              new Paragraph({
                text:""
            }),

              new Paragraph({
                text:"Output:",
                heading:HeadingLevel.HEADING_4,
                children  :[
                  new TextRun({
                    
                    bold:true,
                    italics:false,
                  })
                ]
                
              }),
             
            ],
          },
        ],
      });
      Packer.toBlob(doc).then((blob)=>{
        saveAs(blob,'code.docx');
      });

    }
    else if(fileFormat==='.pdf'){
      const doc=new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0); 

    doc.setFont("times", "bold");
    const pageWidth=doc.internal.pageSize.width;
    const textWidth=doc.getTextWidth("EXPERIMENT-");
    doc.text("EXPERIMENT-",(pageWidth-textWidth)/2,20);
     
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Aim:",10,30);
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Source Code:", 10, 40);
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      doc.text(code, 10, 50);
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Output:", 10, 60 + doc.getTextDimensions(code).h);
      doc.setFontSize(12);
      doc.save('code.pdf');
    }
  }
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={20}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    <div className='h-4 w-full bg-gradient-to-r from-violet-800 via-purple-600 to-pink-400'>
    <div className='flex flex-row py-4 items-center'>
  <div className="px-4 py-2">
    <LanguageDropdown OnSelectChange={onSelectChange} />
  </div>
  <div className="px-4 py-2">
    <SaveCodeDropdown onSelectChange={onSelectChangeFormat}/>
  </div>

 
  <div className="ml-8">
    <a href="https://www.buymeacoffee.com/kshitiz11101" target="_blank" rel="noopener noreferrer">
      <img
        src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png"
        alt="Buy Me A Coffee"
        style={{
          marginTop:'9px',
          height: '50px',
          width: '180px',
          boxShadow: '0px 3px 2px 0px rgba(190, 190, 190, 0.5)',
          WebkitBoxShadow: '0px 3px 2px 0px rgba(190, 190, 190, 0.5)',
        }}
      />
    </a>
  </div>
</div>

        <div className='flex flex-row space-x-4 items-start px-4 py-4'>
          <div className='flex flex-col w-full h-full justify-start items-end'>
            <CodeEditor
              code={code}
              onChange={onChange}
              language={language?.value}

              // theme={theme.valueOf}
            />
          </div>
          <div className='right-container flex flex-shrink-0 w-[30%] flex-col'>
            <OutputWindow outputDetails={outputDetails} />
            <div className='flex flex-col items-end'>
              <CustomInput customInput={customInput} setCustomInput={setCustomInput} />
              <button
                onClick={handleCompile}
                disabled={!code}
                className={classnames(
                  "mt-4 border-2 border-black z-10 rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow transition duration-200 bg-green-600 flex-shrink-0 text-white",
                  !code ? "opacity-50" : ""
                )}>
                {processing ? "Processing..." : "Compile and Execute"}
              </button>
              <button
              onClick={saveFile}
              disabled={!fileFormat}
              className={classnames(
                "mt-4 border-2 border-black z-10 rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow transition duration-200 bg-blue-600 flex-shrink-0 text-white",
                !fileFormat ? "opacity-50" : ""
              )}>Save File</button>
            </div>
            {outputDetails && <OutputDetails outputDetails={outputDetails} />}
            
          </div>
        </div>
        <h1 className='font-bold items-center text-center'>Made with ❤️ by Kshitiz Sharma</h1>
      </div>
    </>
  );
}

export default Landing;
