import { useEffect, useState, useRef } from 'react';
import { Inter } from 'next/font/google'
import { Input, Radio, Button } from '@nextui-org/react';

import Spinner from '../../components/spinner';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [urlRequired, setURLRequired] = useState('');
  const [pathRequired, setPathRequired] = useState('');
  
  const [result, setResult] = useState('');

  const [msgColor, setMsgColor] = useState('text-gray-600');
  const [selected, setChecked] = useState('video');  

  const youtubeURL = useRef(null);
  const folderPath = useRef(null);

  const onDownload = () => {  
    setResult('Downloading...');

    if(youtubeURL.current.value == '') {
      setURLRequired('Required');
      youtubeURL.current.focus();
      return;
    }

    if(folderPath.current.value == '') {
      setPathRequired('Required');
      folderPath.current.focus();
      return;
    }

    const postData = async () => {
      const data = {
        youtubeURL: youtubeURL.current.value,
        path: folderPath.current.value,
        type: selected
      };

      const response = await fetch("/api/download", {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if(response.status === 200){
        return response.json();     
      }      
    };

    postData().then((data) => {
      if(data.message) {
        setMsgColor('text-green-600'); 
        setResult(data.message);        
      } 
    });
  }

  return (
    <main
      className="p-24"
    >
      <div className="w-full flex items-center mb-6">
        <label className="w-2/12 block">Youtube URL</label>
        <Input width="100%" helperText={urlRequired} ref={youtubeURL}/>
      </div>
      <div className="w-full flex items-center p-4 mb-6 border">
        <Radio.Group 
          orientation="horizontal"
          label="Download Type"
          value={selected}
          onChange={setChecked}
        >
          <Radio value="video">Video (mp4)</Radio>
          <Radio value="audio">Audio (mp3)</Radio>
        </Radio.Group>
      </div>
      <div className="w-full flex items-center mb-6">
        <label className="w-2/12 block">Saved Path</label>
        <Input width="100%" helperText={pathRequired} ref={folderPath}/>
      </div>
      <div className="w-full flex items-center">
        <div className="w-2/12">
          <Button auto color="success" rounded bordered onPress={onDownload}>
            Download
          </Button>
        </div>
        {
          (result != '' && result != 'Completed!') ? (
            <div className="w-10/12">          
              <Spinner />                        
            </div> 
          ) : '' }
          <span className={msgColor}>{result}</span>
      </div>
    </main>
  )
}
