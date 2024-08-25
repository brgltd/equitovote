import {
	useWriteContract
} from "wagmi";
import Config from "../../config";

export default function UtilsPage() {
	const { writeContactAsync } = useWriteContract();

	const sendToken = async () => {
		/* const hash = await writeContractAsync({ */
		/* 	address: Config.EquitoSwap_ArbitrumSepolia_V1, */
		/* }); */
	};

	return (
		<button
			onClick={sendToken}
		>
			send token
		</button>
	);
}

