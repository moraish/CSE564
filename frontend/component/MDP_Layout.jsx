import MDP from "./MDP";
import PDP from "./PDP";

export default function MDP_Layout() {
    return (
        <>
            <div>
                <MDP />
            </div>
            <div className="mb-15">
                <PDP />
            </div>
        </>
    )
}