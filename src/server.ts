import type { Server, Connection, Room } from 'partykit/server';

type PollOption = {
	id: string;
	text: string;
	votes: number;
};

type Poll = {
	id: string;
	name: string;
	question: string;
	options: PollOption[];
	isActive: boolean;
};

type PollState = {
	polls: Poll[];
	currentPollId: string;
};

export default class PollServer implements Server {
	private state: PollState;

	constructor(readonly room: Room) {
		this.state = {
			currentPollId: 'poll1',
			polls: [
				{
					id: 'poll1',
					name: 'Poll 1',
					question: 'Which option is correct?',
					options: [
						{ id: 'a', text: 'A', votes: 0 },
						{ id: 'b', text: 'B', votes: 0 },
						{ id: 'c', text: 'C', votes: 0 },
						{ id: 'd', text: 'D', votes: 0 },
						{ id: 'e', text: 'E', votes: 0 },
					],
					isActive: true,
				},
				{
					id: 'poll2',
					name: 'Poll 2',
					question: 'Which option is the best?',
					options: [
						{ id: 'a', text: 'A', votes: 0 },
						{ id: 'b', text: 'B', votes: 0 },
						{ id: 'c', text: 'C', votes: 0 },
						{ id: 'd', text: 'D', votes: 0 },
					],
					isActive: false,
				},
				{
					id: 'poll3',
					name: 'Poll 3',
					question: 'True or False?',
					options: [
						{ id: 'true', text: 'True', votes: 0 },
						{ id: 'false', text: 'False', votes: 0 },
					],
					isActive: false,
				},
				{
					id: 'poll4',
					name: 'Poll 4',
					question: 'Yes or No?',
					options: [
						{ id: 'yes', text: 'Yes', votes: 0 },
						{ id: 'no', text: 'No', votes: 0 },
						{ id: 'maybe', text: 'Maybe', votes: 0 },
					],
					isActive: false,
				},
				{
					id: 'poll5',
					name: 'Poll 5',
					question: 'On a scale of 1 to 5, how are you feeling about what we just learned?',
					options: [
						{ id: 'a', text: '1', votes: 0 },
						{ id: 'b', text: '2', votes: 0 },
						{ id: 'c', text: '3', votes: 0 },
						{ id: 'd', text: '4', votes: 0 },
						{ id: 'e', text: '5', votes: 0 },
					],
					isActive: false,
				},
			],
		};
	}

	async onConnect(conn: Connection) {
		// Send current state to new connections
		conn.send(JSON.stringify(this.state));
	}

	async onMessage(message: string, sender: Connection) {
		const data = JSON.parse(message);

		if (data.type === 'vote') {
			this.handleVote(data.pollId, data.optionId);
		} else if (data.type === 'changePoll') {
			this.changeCurrentPoll(data.pollId);
		} else if (data.type === 'resetPoll') {
			this.resetPollVotes(data.pollId);
		}
	}

	private handleVote(pollId: string, optionId: string) {
		const poll = this.state.polls.find((p) => p.id === pollId);
		if (poll && poll.isActive) {
			const option = poll.options.find((o) => o.id === optionId);
			if (option) {
				option.votes++;
				this.broadcastState();
			}
		}
	}

	private changeCurrentPoll(pollId: string) {
		const newPoll = this.state.polls.find((p) => p.id === pollId);
		if (newPoll) {
			// Deactivate all polls
			this.state.polls.forEach((p) => (p.isActive = false));
			// Activate the selected poll
			newPoll.isActive = true;
			this.state.currentPollId = pollId;
			this.broadcastState();
		}
	}

	private resetPollVotes(pollId: string) {
		const poll = this.state.polls.find((p) => p.id === pollId);
		if (poll) {
			for (const option of poll.options) {
				option.votes = 0;
				this.broadcastState();
			}
		}
	}

	private broadcastState() {
		this.room.broadcast(JSON.stringify(this.state));
	}
}
