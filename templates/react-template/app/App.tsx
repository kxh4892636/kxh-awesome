import "./index.css";
import { Button } from "antd";

export function App() {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-red-50">
			<div className="text-4xl text-blue-500">Hello World!</div>
			<Button>Click me</Button>
		</div>
	);
}

export default App;
