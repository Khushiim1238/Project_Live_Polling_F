import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import io from "socket.io-client";
import ChatPopover from "../../components/chat/ChatPopover";
import { useNavigate } from "react-router-dom";
import eyeIcon from "../../assets/eye.svg";

let apiUrl =
  import.meta.env.VITE_NODE_ENV === "production"
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:3000";
const socket = io(apiUrl);

const TeacherPollPage = () => {
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([]);
  const [votes, setVotes] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [participants, setParticipants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("pollCreated", (pollData) => {
      setPollQuestion(pollData.question);
      setPollOptions(pollData.options);
      setVotes({});
    });

    socket.on("pollResults", (updatedVotes) => {
      setVotes(updatedVotes);
      setTotalVotes(Object.values(updatedVotes).reduce((a, b) => a + b, 0));
    });

    socket.on("participantsUpdate", (updatedParticipants) => {
      setParticipants(updatedParticipants);
    });

    return () => {
      socket.off("pollCreated");
      socket.off("pollResults");
      socket.off("participantsUpdate");
    };
  }, []);

  const calculatePercentage = (count) => {
    if (totalVotes === 0) return 0;
    return (count / totalVotes) * 100;
  };

  const askNewQuestion = () => {
    navigate("/teacher-home-page");
  };

  const handleViewPollHistory = () => {
    navigate("/teacher-poll-history");
  };

  // Kick a student
  const handleKick = (username) => {
    socket.emit("kickOut", username);
  };

  return (
    <>
      <button
        className="btn rounded-pill ask-question poll-history px-4 m-2"
        onClick={handleViewPollHistory}
      >
        <img src={eyeIcon} alt="" />
        View Poll history
      </button>

      <div className="container mt-5 w-50">
        <h3 className="mb-4 text-center">Poll Results</h3>

        {/* Participants list with kick buttons */}
        {participants.length > 0 && (
          <div className="mb-3">
            <h6>Participants:</h6>
            {participants.map((user) => (
              <div
                key={user}
                className="d-flex justify-content-between align-items-center mb-2"
              >
                <span>{user}</span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleKick(user)}
                >
                  Kick
                </button>
              </div>
            ))}
          </div>
        )}

        {pollQuestion && (
          <>
            <div className="card">
              <div className="card-body">
                <h6 className="question py-2 ps-2 text-left rounded text-white">
                  {pollQuestion} ?
                </h6>
                <div className="list-group mt-4">
                  {pollOptions.map((option) => (
                    <div key={option.id} className="list-group-item rounded m-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{option.text}</span>
                        <span>
                          {Math.round(calculatePercentage(votes[option.text] || 0))}%
                        </span>
                      </div>
                      <div className="progress mt-2">
                        <div
                          className="progress-bar progress-bar-bg"
                          role="progressbar"
                          style={{
                            width: `${calculatePercentage(votes[option.text] || 0)}%`,
                          }}
                          aria-valuenow={votes[option.text] || 0}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <button
                className="btn rounded-pill ask-question px-4 m-2"
                onClick={askNewQuestion}
              >
                + Ask a new question
              </button>
            </div>
          </>
        )}

        {!pollQuestion && (
          <div className="text-muted">
            Waiting for the teacher to start a new poll...
          </div>
        )}

        <ChatPopover />
      </div>
    </>
  );
};

export default TeacherPollPage;
